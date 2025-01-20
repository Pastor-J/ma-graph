import time
from langchain_ollama import OllamaLLM
import json

llm = OllamaLLM(model="llama3.1:8b")
predicted = []

def simple_analysis(flow_data):
  seedId = flow_data["seedId"]

  if not seedId:
    return "Please select a node for analysis."
  
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
    You are an AI-Assitant for Failure Mode and Effects Analysis with focus on Systems. Please analyse this graph with nodes: {extracted_nodes_info} and edges: {edges}. The graph has three hierarchie levels indicated by the 'type' attribute with 'systemNode' being the least detailed, 'assemblyNode' being more detailed and 'componentNode' being most detailed. Return a possible fault for node with id {seedId}. Keep it as short as possible. Your ouput string should be maximum 5 words long. Please make sure not to make it any longer. Also make sure not to predict faults which are already included in {predicted}.
  """
  # TODO: Use Reasoning of LLM to fine tune the query

  # for chunk in llm.stream(query):
  #   print(chunk, end="", flush=True)
  # print("\n")
  result = llm.invoke(query)
  print(query)

  predicted.append(result)

  return result
