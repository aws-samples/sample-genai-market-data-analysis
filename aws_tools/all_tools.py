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
def code_execution_tool(code):
    dp_client = boto3.client('bedrock-agentcore')
    
    str_libraries_list = "boto3 yfinance"
    command = f"pip install {str_libraries_list}"

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
        arguments={"command": command}
        )
        from pprint import pprint
        for event in response['stream']:
            pprint(event)
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



    

