## Application Overview:

This is a financial market analysis application that combines AI agents with real-time market data to provide intelligent investment insights.

Core Architecture:

Backend: Python-based Strands + AWS AgentCore system with multiple specialized AI agents (planner, financial analyst, coder, chart generator, market data analyst, critic)

Frontend: Next.js web application with Cognito authentication

AI Models: Uses Bedrock models (Claude 3.7 Sonnet, Llama 4 Maverick, Nova) for different agent roles

Key Features:

Multi-agent system that collaborates to analyze market data

Real-time market data integration via REST API and Alpaca parquet files

Automated chart generation using Bedrock Code Interpreter

S3-based chart storage with presigned URLs for sharing

Secure authentication via AWS Cognito OIDC

Data Flow:

User submits market analysis request through web UI

Planner agent coordinates other specialized agents

Agents fetch market data, perform analysis, generate charts

Results are compiled and presented to user with visualizations

Deployment Model:

Containerized backend deployed on AWS AgentCore

Frontend deployed on ECS/Fargate/App Runner

Integrated with AWS services (Bedrock, S3, Cognito, Code Interpreter)


## How to run:

### Installation process for the agents and AgentCore:

**Inside the main folder run:**
````bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
````

**Create a dot env file .env with the following content and add your bucket:**
````
S3_CHART_BUCKET=s3://add_your_own_bucket_here
````
### Installation process for the frontend

**Inside the front2 folder:**
````bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
````

### Running AgentCore locally:
**inside the main folder**
````bash
source venv/bin/activate
python main.py
````



### Running the frontend locally:

In the folder front1 run the following commands:

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000) with your browser to see the result.

### Building

Build the application for production:

```bash
npm run build
```

### Running the frontend locally: [Deprecated]
**inside the main folder**
````bash
source venv/bin/activate
python app.py
````




### What to expect:
1. We have data from 25 Stocks (AMZN, Netflix, MSFT, GOOGL, Costco)
2. The agents can fetch news for any stock (mode than the 25)
3. The agents can run technical analysis on any of the 25 stocks.
4. The agents can calculate the returns of any of the 25 stocks for up to 3 months
5. Questions at this moment have to involve a stock or list of stocks:
- Example:
Compare the returns of Amazon, Apple and Google
Whats the correlation between Apple and Amazon? 

The next step is to hook the whole universe of stocks and PySpark to have the agent running complex calcudlations.


### Tasks:
1. Adding PySpark and support using the aws_agents/parquet_agent.py
2. Adding FDC3 support for the front-end

Security
See CONTRIBUTING for more information.

License
This library is licensed under the MIT-0 License. See the LICENSE file.
