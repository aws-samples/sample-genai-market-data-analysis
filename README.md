## How to run:

### Installation process for the agents and AgentCore:

**Inside the main folder run:**
````bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
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
**inside the main folder**
````bash
source venv/bin/activate
python app.py
````

Go to http://127.0.0.1:5000


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