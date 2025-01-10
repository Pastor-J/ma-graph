import time
from langchain_ollama import OllamaLLM
import json

llm = OllamaLLM(model="llama3.1:8b")

def analyze_result(flow_data):
  flow_data = json.dumps(flow_data)
  prompt = flow_data + "Please analyse this graph. Answer in one sentence."
  response = llm.invoke(prompt)
  print(response)
