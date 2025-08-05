from dotenv import load_dotenv
load_dotenv()

from strands import Agent, tool
from strands_tools import calculator  # Import the calculator tool
import argparse
import json
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from bedrock_agentcore.tools.code_interpreter_client import CodeInterpreter, code_session
from strands.models import BedrockModel
import requests

from starlette.middleware.cors import CORSMiddleware

import boto3
import base64
import os
from datetime import datetime
from aws_tools.all_tools import *


app = BedrockAgentCoreApp(debug=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


system_prompt = """
# Adaptive financial Assistant Response System

## Task Objective
You are an adaptive AI assistant that tailors responses based on the user's technical sophistication level. Your goal is to provide accurate, appropriately complex information that matches the user's knowledge level while utilizing data tools when necessary.

## Response Guidelines
1. **Assess Query Sophistication**:
   - Analyze the technical complexity and domain knowledge demonstrated in the user's query
   - Identify industry-specific terminology or concepts mentioned
   - Do not add any other text preamble or header outside the json format required on the output.

2. **Match Response Complexity**:
   - <technical_queries>For queries containing industry jargon or advanced concepts, respond with professional-level analysis using appropriate technical terminology</technical_queries>
   - <basic_queries>For basic or general queries, provide clear explanations with minimal jargon and accessible language</basic_queries>
   - Always maintain accuracy regardless of explanation complexity

3. **Data and Visualization Protocol**:
   - For any request requiring data analysis, utilize available tools to retrieve and process relevant information
   - When appropriate, reference specific information from the provided context
   - Generate visualizations using the plotly==5.22.0 library when:
     - Visual representation would enhance understanding of the data
     - The user explicitly requests a chart
     - Complex data relationships need to be illustrated
     - The chart tool returns a signed url of the chart on S3.

4. **DONT DO**: add any header, preamble, or intro because it breaks the output, make sure the final response is valid json

## Output Format JSON:
Your response must be formatted as a valid JSON object.
- The "text" field must contain your complete response formatted in Markdown
- The "charts" field must contain an array of the s3 signed url of the chart images (if any were generated), or an empty array if no charts were created
- stringify the whole response and scape the characters that break the json format

{{"text": "Your final response in Markdown format for enhanced readability",
    "charts": ["s3_signed_url", "s3_signed_url", ...]}}

"""









model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
model = BedrockModel(
    model_id=model_id,
)
agent = Agent(
    model=model,
    tools=[calculator, smart_responses, stock_performance_returns, get_news_for_stock,
           get_technical_analysis_for_stock, get_financial_info_for_stock, chart_generator],
    system_prompt=system_prompt

)


@app.entrypoint
def strands_agent_bedrock(payload):
    """
    Invoke the agent with a payload
    """
    user_input = payload.get("prompt")
    print("User input:", user_input)
    response = agent(user_input)
    print("--------------------- RESPONSE -------------------")
    print(response.message['content'][0]['text'])
    print("--------------------- END RESPONSE -------------------")
    return response.message['content'][0]['text']


if __name__ == "__main__":
    app.run()
