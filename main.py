import os
from dotenv import load_dotenv

# Load environment variables from .env and secrets.env
load_dotenv()  # Load .env first
load_dotenv('secrets.env')  # Load secrets.env (overrides .env if conflicts)
from strands.multiagent import Swarm, GraphBuilder
from strands import Agent, tool
from strands_tools import calculator  # Import the calculator tool
import argparse
import json
from bedrock_agentcore.runtime import BedrockAgentCoreApp
import requests
from starlette.middleware.cors import CORSMiddleware
import boto3
from datetime import datetime
from aws_agents.all_agents import financial_analyst_agent, coding_agent, chart_agent, final_response_agent, market_data_agent, planner_agent, critic_agent
import time


app = BedrockAgentCoreApp(debug=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


swarm = Swarm(
    [financial_analyst_agent, coding_agent, chart_agent, market_data_agent, critic_agent],
    max_handoffs=30,
    max_iterations=90,
    execution_timeout=7200.0,  # 15 minutes
    node_timeout=1800.0,       # 5 minutes per agent
    repetitive_handoff_detection_window=10,  # There must be >= 3 unique agents in the last 8 handoffs
    repetitive_handoff_min_unique_agents=5
)

builder = GraphBuilder()
builder.add_node(planner_agent, "planner")
builder.add_node(swarm, "research")
builder.add_node(final_response_agent, "output")
builder.add_edge("planner", "research")
builder.add_edge("research", "output")


graph = builder.build()

@app.entrypoint
def strands_agent_bedrock(payload):
    """
    Invoke the agent with a payload
    """
    user_input = payload.get("prompt") or payload.get("message")
    today_date = time.ctime()
    user_input = user_input + f"\n###For clarification today date is: {today_date}"

    result = graph(user_input)
    from pprint import pprint
    print("--------------------- RESPONSE -------------------")
    pprint(result)
    print("--------------------- END RESPONSE -------------------")
    return result.results["output"].result


if __name__ == "__main__":
    app.run()
