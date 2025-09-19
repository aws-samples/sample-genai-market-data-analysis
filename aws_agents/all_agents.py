from aws_tools.all_tools import stock_performance_returns, get_news_for_stock, code_execution_tool, get_technical_analysis_for_stock, get_financial_info_for_stock, stock_performance_returns
from bedrock_agentcore.tools.code_interpreter_client import CodeInterpreter, code_session
from strands.models import BedrockModel
from strands import Agent, tool
from strands_tools import calculator
from aws_prompts.prompt import *


Claude37 = BedrockModel(model_id="us.anthropic.claude-3-7-sonnet-20250219-v1:0", max_tokens=64000)
Llama4 = BedrockModel(model_id="us.meta.llama4-maverick-17b-instruct-v1:0", max_tokens=4096)
NovaPremier = BedrockModel(model_id="us.amazon.nova-premier-v1:0")
Claude4 = BedrockModel(model_id="global.anthropic.claude-sonnet-4-20250514-v1:0", max_tokens=64000)
OpenAI = BedrockModel(model_id="openai.gpt-oss-120b-1:0", region_name="us-west-2", max_tokens=8192)
Claude4opus = BedrockModel(model_id="us.anthropic.claude-opus-4-20250514-v1:0", max_tokens=32000)



planner_agent = Agent(
    name="planner",
    model=OpenAI,
    system_prompt=planner_prompt,
)


critic_agent = Agent(
    name="critic",
    model=NovaPremier,
    system_prompt=critic_prompt
)

financial_analyst_agent = Agent(
    name="financialAnalyst",
    model=Claude37,
    tools=[calculator, get_news_for_stock, get_technical_analysis_for_stock, get_financial_info_for_stock, stock_performance_returns],
    system_prompt=system_prompt_financial,

)

coding_agent = Agent(
    name="coder",
    model=OpenAI,
    tools=[code_execution_tool],
    system_prompt=system_prompt_coding,
)


chart_agent = Agent(
    name="charts",
    model=Claude4,
    system_prompt=chart_generator_prompt,
    tools=[code_execution_tool]
)

market_data_agent = Agent(
    name="marketDataResearch",
    model=Claude37,
    system_prompt=full_market_data_prompt,
    tools=[code_execution_tool]
)

final_response_agent = Agent(
    name="finalResponse",
    model=Llama4,
    system_prompt="""You are an experience HTML coder, make sure all text is properly formatted. 
                     Do not add explanations just make sure the full text is valid html.
                     The code can use class names from Tailwind CSS to make things more readable.
                     If there are headers and titles make sure they use H2/H3. For tables use striped and borders.
                     Use some colors when needed to highlight important things.
                     Make sure to format the html to according to the type of information you are presenting, 
                     add spaces or separator, boxes or other constructs to make the information visually pleasant. Do not start with ````HTML or other markdown style.
                     Never use white fonts because the background is white
                     """
)
