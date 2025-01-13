import time
from langchain_ollama import OllamaLLM
import json

llm = OllamaLLM(model="llama3.1:8b")

def simple_analysis(flow_data):
  flow_data = json.dumps(flow_data)
  query = f"""
    You are a AI-Assitant for Failure Mode and Effects Analysis. Please analyse this graph: {flow_data}. Return a possible fault for node with id 4. Keep it as short as possible. Your ouput string should be maximum 5 words long.
  """
  # for chunk in llm.stream(query):
  #   print(chunk, end="", flush=True)
  # print("\n")
  result = llm.invoke(query)

  return result
