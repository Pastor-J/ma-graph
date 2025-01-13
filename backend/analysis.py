import time
from langchain_ollama import OllamaLLM
import json

llm = OllamaLLM(model="llama3.1:8b")

def simple_analysis(flow_data):
  seedId = flow_data["seedId"]
  flow = flow_data["flow"]
  nodes = flow["nodes"]
  edges = flow["edges"]

  extracted_nodes_info = []

  for node in nodes:
    essential_node_info = {
      'id': node['id'],
      'type': node['type'],
      'data': node['data']
    }

    extracted_nodes_info.append(essential_node_info)


  query = f"""
    You are a AI-Assitant for Failure Mode and Effects Analysis. Please analyse this graph with nodes: {extracted_nodes_info} and edges: {edges}. Return a possible fault for node with id {seedId}. Keep it as short as possible. Your ouput string should be maximum 5 words long.
  """
  # TODO: Use Reasoning of LLM to fine tune the query
  print(query)

  # for chunk in llm.stream(query):
  #   print(chunk, end="", flush=True)
  # print("\n")
  result = llm.invoke(query)

  return result
