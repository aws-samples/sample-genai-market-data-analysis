import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from "@aws-sdk/client-bedrock-agentcore";
import { fromEnv } from "@aws-sdk/credential-providers";

export interface BedrockAgentResponse {
  content: string;
  success: boolean;
  error?: string;
}

class BedrockAgentService {
  private client?: BedrockAgentCoreClient;
  private agentRuntimeArn?: string;
  private qualifier?: string;
  private initialized = false;

  private initialize() {
    if (this.initialized) return;

    try {
      this.client = new BedrockAgentCoreClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: fromEnv(),
      });

      this.agentRuntimeArn = process.env.BEDROCK_AGENT_RUNTIME_ARN || '';
      this.qualifier = process.env.BEDROCK_AGENT_QUALIFIER || '';

      if (!this.agentRuntimeArn) {
        throw new Error('BEDROCK_AGENT_RUNTIME_ARN environment variable is required');
      }

      this.initialized = true;
    } catch (error) {
      throw new Error('Failed to initialize BedrockAgentService');
    }
  }

  async invokeAgent(query: string): Promise<BedrockAgentResponse> {
    this.initialize();

    try {
      const payload = new TextEncoder().encode(JSON.stringify({ prompt: query }));

      const input: any = {
        agentRuntimeArn: this.agentRuntimeArn!,
        payload: payload,
      };

      if (this.qualifier && this.qualifier !== 'DEFAULT' && this.qualifier.trim()) {
        input.qualifier = this.qualifier;
      }

      const command = new InvokeAgentRuntimeCommand(input);

      // Add timeout handling for AWS SDK call (29 minutes to leave buffer for API route)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Bedrock Agent request timeout after 29 minutes'));
        }, 29 * 60 * 1000);
      });

      const response = await Promise.race([
        this.client!.send(command),
        timeoutPromise
      ]);

      let content = '';

      if (response.response) {
        try {
          content = await response.response.transformToString();
        } catch {
          const bytes = await response.response.transformToByteArray();
          content = new TextDecoder().decode(bytes);
        }
      } else if (typeof response === 'string') {
        content = response;
      } else if (response && typeof response === 'object') {
        // Try to extract content from the response object directly first
        const responseObj = response as any;

        // Handle direct content fields
        if (responseObj.content) {
          content = responseObj.content;
        } else if (responseObj.message) {
          content = responseObj.message;
        } else if (responseObj.text) {
          content = responseObj.text;
        } else {
          // Fallback to JSON string
          content = JSON.stringify(response);
        }
      }

      if (!content) {
        throw new Error('No content received from Bedrock Agent');
      }

      // Handle different response formats

      // First, check if it's a Python-style string representation (not JSON)
      if (content.includes("'response': AgentResult(") && content.includes("'text':")) {
        // This is a Python string representation, extract the text content
        const textPattern = "'text': '";
        const startIndex = content.indexOf(textPattern);

        if (startIndex !== -1) {
          const contentStart = startIndex + textPattern.length;

          // Find the end by looking for the closing quote, but handle escaped quotes
          let contentEnd = contentStart;
          let foundEnd = false;

          for (let i = contentStart; i < content.length - 1; i++) {
            // Look for a single quote that's not escaped
            if (content[i] === "'" && content[i - 1] !== '\\') {
              contentEnd = i;
              foundEnd = true;
              break;
            }
          }

          if (foundEnd && contentEnd > contentStart) {
            const extractedContent = content.substring(contentStart, contentEnd);
            // Clean up escaped characters
            content = extractedContent
              .replace(/\\n/g, '\n')
              .replace(/\\t/g, '\t')
              .replace(/\\r/g, '\r')
              .replace(/\\'/g, "'")
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\');
          }
        }
      }
      // Then try to parse as JSON if it looks like JSON
      else if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(content);

          // Handle the specific structure: {"response": "AgentResult(...)", "status": "success"}
          if (parsed.response && typeof parsed.response === 'string') {
            const responseStr = parsed.response;

            // Check if it's an AgentResult string representation
            if (responseStr.includes('AgentResult') && responseStr.includes("'text':")) {
              // Find the start of the text content
              const textPattern = "'text': '";
              const startIndex = responseStr.indexOf(textPattern);

              if (startIndex !== -1) {
                const contentStart = startIndex + textPattern.length;

                // Find the end by looking for the closing quote, but handle escaped quotes
                let contentEnd = contentStart;
                let foundEnd = false;

                for (let i = contentStart; i < responseStr.length - 1; i++) {
                  // Look for a single quote that's not escaped
                  if (responseStr[i] === "'" && responseStr[i - 1] !== '\\') {
                    contentEnd = i;
                    foundEnd = true;
                    break;
                  }
                }

                if (foundEnd && contentEnd > contentStart) {
                  const extractedContent = responseStr.substring(contentStart, contentEnd);
                  // Clean up escaped characters
                  content = extractedContent
                    .replace(/\\n/g, '\n')
                    .replace(/\\t/g, '\t')
                    .replace(/\\r/g, '\r')
                    .replace(/\\'/g, "'")
                    .replace(/\\"/g, '"')
                    .replace(/\\\\/g, '\\');
                } else {
                  content = responseStr;
                }
              } else {
                content = responseStr;
              }
            } else {
              // Regular string response
              content = responseStr;
            }
          }
          // Handle nested object structure
          else if (parsed.response && typeof parsed.response === 'object') {
            const agentResult = parsed.response;

            // Check for message.content structure
            if (agentResult.message && agentResult.message.content && Array.isArray(agentResult.message.content)) {
              const contentArray = agentResult.message.content;
              if (contentArray.length > 0 && contentArray[0].text) {
                content = contentArray[0].text;
              } else {
                content = contentArray.map((item: any) => item.text || JSON.stringify(item)).join('\n');
              }
            }
            // Handle other nested structures
            else {
              content = agentResult.content || agentResult.message || agentResult.text || JSON.stringify(agentResult);
            }
          }
          // Handle direct content fields
          else if (parsed.content) {
            content = parsed.content;
          } else if (parsed.message) {
            content = parsed.message;
          } else if (parsed.text) {
            content = parsed.text;
          }
        } catch (parseError) {
          // Content is not valid JSON, use as-is
        }
      }

      return {
        content: this.cleanupHtmlContent(content.trim()),
        success: true,
      };

    } catch (error) {
      const errorMessage = this.getErrorMessage(error);

      return {
        content: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  private getErrorMessage(error: unknown): string {
    if (!(error instanceof Error)) {
      return 'Unknown error occurred';
    }

    if (error.message.includes('AccessDenied')) {
      return 'Access denied. Please check your AWS credentials and Bedrock Agent permissions.';
    }

    if (error.message.includes('ResourceNotFound')) {
      return 'Bedrock Agent not found. Please verify the Agent Runtime ARN is correct and the agent is deployed.';
    }

    if (error.message.includes('ValidationException')) {
      return 'Invalid request parameters. The payload format or agent configuration may be incorrect.';
    }

    if (error.message.includes('RuntimeClientError')) {
      return 'Runtime error from Bedrock Agent. Please check the agent configuration and deployment status.';
    }

    return error.message;
  }



  /**
   * Clean up HTML content by removing escaped characters
   */
  private cleanupHtmlContent(content: string): string {
    return content
      // Remove leading/trailing quotes if present
      .replace(/^["']|["']$/g, '')
      // Convert escaped newlines to actual newlines, then remove excessive newlines
      .replace(/\\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with just 2
      // Convert escaped quotes to regular quotes
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      // Remove other common escape sequences
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      // Clean up any remaining backslashes before quotes
      .replace(/\\(.)/g, '$1')
      .trim();
  }

  async healthCheck(): Promise<boolean> {
    try {
      this.initialize();
      const testResponse = await this.invokeAgent('health check');
      return testResponse.success;
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const bedrockAgentService = new BedrockAgentService();
export default bedrockAgentService;