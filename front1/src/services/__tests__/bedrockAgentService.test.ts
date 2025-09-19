import { bedrockAgentService } from '../bedrockAgentService';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-bedrock-agentcore', () => ({
  BedrockAgentCoreClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  InvokeAgentRuntimeCommand: jest.fn(),
}));

jest.mock('@aws-sdk/credential-providers', () => ({
  fromEnv: jest.fn(),
}));

describe('BedrockAgentService', () => {
  beforeEach(() => {
    // Set up environment variables for testing
    process.env.AWS_REGION = 'us-east-1';
    process.env.BEDROCK_AGENT_RUNTIME_ARN = 'arn:aws:bedrock-agentcore:us-east-1:763406250311:runtime/main-3LjbueDZVg';
    process.env.BEDROCK_AGENT_QUALIFIER = 'test-endpoint';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('invokeAgent', () => {
    it('should handle missing agent runtime ARN', async () => {
      // Temporarily remove the ARN
      delete process.env.BEDROCK_AGENT_RUNTIME_ARN;
      
      const result = await bedrockAgentService.invokeAgent('test query');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Bedrock Agent Runtime ARN not configured');
    });

    it('should return error response on failure', async () => {
      const result = await bedrockAgentService.invokeAgent('test query');
      
      // Since we're mocking and not setting up the mock response, it should fail
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('healthCheck', () => {
    it('should return false when agent runtime ARN is not configured', async () => {
      delete process.env.BEDROCK_AGENT_RUNTIME_ARN;
      
      const result = await bedrockAgentService.healthCheck();
      
      expect(result).toBe(false);
    });
  });
});