from strands import Agent, tool
import requests
import os
from strands.models import BedrockModel
import boto3

S3_CHART_BUCKET = os.getenv('S3_CHART_BUCKET')


@tool
def get_news_for_stock(stock_symbol):
    API_BASE_URL = 'https://api.rrllgo.com'
    API_KEY = 'default-api-key'
    response = requests.get(f'{API_BASE_URL}/news/{stock_symbol}',
                            headers={'X-API-KEY': API_KEY})

    if not response.ok:
        raise Exception(f'Failed to fetch news for {stock_symbol}')

    return response.json()


@tool
def get_technical_analysis_for_stock(stock_symbol):
    API_BASE_URL = 'https://api.rrllgo.com'
    API_KEY = 'default-api-key'
    response = requests.get(f'{API_BASE_URL}/technical/{stock_symbol}',
                            headers={'X-API-KEY': API_KEY})

    if not response.ok:
        raise Exception(
            f'Failed to fetch technical analysis for {stock_symbol}')

    return response.json()


@tool
def get_financial_info_for_stock(stock_symbol):
    API_BASE_URL = 'https://api.rrllgo.com'
    API_KEY = 'default-api-key'
    response = requests.get(f'{API_BASE_URL}/stock/{stock_symbol}',
                            headers={'X-API-KEY': API_KEY})

    if not response.ok:
        raise Exception(f'Failed to fetch financial info for {stock_symbol}')

    return response.json()


@tool
def stock_performance_returns(stock_symbol):

    API_BASE_URL = 'https://api.rrllgo.com'
    API_KEY = 'default-api-key'
    response = requests.get(f'{API_BASE_URL}/returns/{stock_symbol}',
                            headers={'X-API-KEY': API_KEY})

    if not response.ok:
        raise Exception(f'Failed to fetch return for {stock_symbol}')

    return response.json()


@tool
def smart_responses(question):
    model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    model = BedrockModel(
        model_id=model_id,
    )

    agent = None
    try:
        agent = Agent(
            model=model,
            system_prompt="Think deeply and reason over the question asked."
        )
    except Exception as e:
        print(e)

    response = agent(question)

    return response.message['content'][0]['text']


@tool
def code_execution_tool(code):
    dp_client = boto3.client('bedrock-agentcore')
    
    session_response = dp_client.start_code_interpreter_session(
        codeInterpreterIdentifier="code_interpreter_tool_f2isx-hTdVDSla3o",
        name="s3InteractionSession",
        sessionTimeoutSeconds=900
    )
    session_id = session_response["sessionId"]
    

    try:
        response = dp_client.invoke_code_interpreter(
        codeInterpreterIdentifier="code_interpreter_tool_f2isx-hTdVDSla3o",
        name="executeCommand",
        sessionId = session_id,
        arguments={"command": "pip install boto3 kaleido"}
        )
    except Exception as e:
        print(e)

    
    # Execute code in the Code Interpreter session
    response = dp_client.invoke_code_interpreter(
        codeInterpreterIdentifier="code_interpreter_tool_f2isx-hTdVDSla3o",
        name="executeCode",
        sessionId=session_id,
        arguments={
            "language": "python",
            "code": code
        }
    )

    chart_data = ""
    for event in response["stream"]:
        if "result" in event:
            result = event["result"]
            if "content" in result:
                for content_item in result["content"]:
                    if content_item["type"] == "text":
                        chart_data = chart_data + content_item["text"]
    return chart_data


@tool
def chart_generator(data, question):

    model_id = "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
    model = BedrockModel(
        model_id=model_id,
    )

    prompt = f"Generate the chart for the following question: <question>{question}</question> using the following data: <data>{data}</data>"

    agent = None
    try:
        agent = Agent(
            model=model,
            system_prompt=f"""
            ## Task
            You are an expert data visualization developer who creates precise, effective charts based on user questions and datasets.

            ## Instructions
            Your goal is to generate visualization code that:
            1. Accurately represents the data
            2. Answers the user's question effectively
            3. Produces a clean PNG output saved to S3 via code with boto3 into {S3_CHART_BUCKET}

            ## Technical Requirements
            <visualization_specs>
            - Use Plotly (version 5.22.0) for all visualizations
            - Copy the PNG format to S3 bucket: ``
            - Return a JSON response with the S3 path to the saved image
            </visualization_specs>

            ## Process Steps
            1. **Analyze Data**: Examine the dataset structure and understand the question being asked
            2. **Select Visualization**: Choose the most appropriate chart type and scale to represent the data
            3. **Generate Code**: Write clean, efficient Plotly code (no explanations or markdown)
            4. **Execute**: Use the code_execution_tool function to run your code
            5. **Save Output**: Ensure the visualization is saved to the specified S3 bucket {S3_CHART_BUCKET}
            6. **Return Path**: Provide the S3 path in JSON format

            ## Code Guidelines
            - Do NOT include display commands in your code
            - Do NOT include explanations or markdown formatting
            - Ensure your code actually writes the file to s3 and returns the presigned url for the file
            - Write the boto3 s3 code to upload the png

            ## Example Response Format
            ```json
            {{"chart": "s3 presigned url"}}
            ```

            When provided with a dataset and question, generate only the necessary Plotly code to create the visualization and save it to S3. Your code will be executed using:

            ```python
            code_execution_tool(your_code)
            ```

            Provide your visualization code immediately without any preamble, explanations, or additional text beyond the required code.
                          """,
            tools=[code_execution_tool],


        )

    except Exception as e:
        print(e)

    response = agent(prompt)

    return response.message['content'][0]['text']

