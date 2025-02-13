import time
from langchain_ollama import OllamaLLM
import json
import os
import pandas as pd

# If a dataframe exist: read it. If not: create it.
if os.path.exists('./data'):
  df = pd.read_pickle('./data')
else:
  df = pd.DataFrame(
    {
      "node_id": [],
      "possible_fault": [],
      # "possible_cause": [],
      "possible_consequence": [],
      "reasoning": []
    }
  )

def get_predicted(seedId):
  """
    Returns faults which have already been predicted for every node.

  """

  assert type(int(seedId)) == int, "seedID should be a string containing an int"

  # Get predicted faults for the nodeId
  # NOTE: If node_id does not exist in df, this will NOT throw an error
  predicted = df[df["node_id"] == seedId]
  predicted = set(predicted["possible_fault"])

  # Handle case in which no fault has been predicted yet
  if len(predicted) == 0:
    return "At the moment this set is still empty. As no faults have been predicted yet."
  
  return predicted

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

  print(extracted_nodes_info)
  print(edges)

  query = f"""
    You are an AI-Assitant for Failure Mode and Effects Analysis with focus on Systems. Please analyse this graph with nodes: {extracted_nodes_info} and edges: {edges}. The graph has three hierarchie levels indicated by the 'type' attribute with 'systemNode' being the least detailed, 'assemblyNode' being more detailed and 'componentNode' being most detailed. Return a possible fault for node with id {seedId}. Keep it as short as possible. Your ouput string should be maximum 5 words long. Please make sure not to make it any longer. Also make sure not to predict faults which are already included in {predicted}.
  """
  # TODO: Use Reasoning of LLM to fine tune the query

  # for chunk in llm.stream(query):
  #   print(chunk, end="", flush=True)
  # print("\n")
  result = llm.invoke(query)

  predicted.append(result)

  return result

from langchain_ollama import ChatOllama
import json
llm_json_mode = ChatOllama(model="deepseek-r1:8b", temperature=0, format="json")
llm = ChatOllama(model="deepseek-r1:1.5b", temperature=0.4)

def cot_analysis(flow_data):
  global df
  seedId, system_nodes, assembly_nodes, component_nodes = extract_node_data(flow_data=flow_data)
  
  predicted = get_predicted(seedId=seedId) 

  print(predicted)

  p = f"""
    You are an AI-Assitant for Failure Mode and Effects Analysis with focus on Systems. Your goal is to find a possbile MECHANICAL fault from first principles perspective for the Component Node with id: {seedId} based on a graph which describes a system.

    For the possible fault: 
      Please return a short and concise sentence describing that fault and mark it with "Possible Fault: "
      Furthermore please return a short and concise sentence describing the effect of that fault and mark it with "Consequences: "

    Make sure to predict faults which are very different from those described in the following set: {predicted}. This is VERY important!
    
    The system is discribed by a tree graph with three levels:
      Level 1 System Nodes: {system_nodes}
      Level 2 Assembly Nodes: {assembly_nodes}
      Level 3 Component Nodes: {component_nodes}
      
      These nodes are connected via edges which are defined via the ids of the source and target nodes.
      Edges: {edges}
    
  """

  msg = llm.invoke(p)
  content = msg.content

  analysis = {}

  start_think = "<think>"
  end_think = "</think>"

  idx_start_think = content.find(start_think)

  idx_end_think = content.find(end_think, idx_start_think + len(start_think))

  if idx_start_think != -1 and idx_end_think != -1:
    reasoning = content[idx_start_think + len(start_think):idx_end_think]
    summary = content[idx_end_think + len(end_think):]

    for element in summary.split("\n"):
      if "Possible Fault" in element:
        possible_fault = element.split(": ")[-1]
      elif "Consequences" in element:
        consequences = element.split(": ")[-1]

    # TODO: Check if creation of dict for transmission and dataframe can be combined.
    analysis["possibleFault"] = possible_fault
    analysis["possibleConsequences"] = consequences
    analysis["reasoning"] = reasoning

    new_entries = {
      "node_id": [seedId],
      "possible_fault": [possible_fault],
      "possible_consequences": [consequences],
      "reasoning": [reasoning]  
    }

    # Add new entries to dataframe and store it on disc
    new_row = pd.DataFrame(new_entries)
    df = pd.concat([df, new_row], ignore_index=True)
    df = df.drop_duplicates() # Make sure there are no duplicates
    df.to_pickle("data")

    print(df)

    return analysis
  
  else:
    return "[ERROR] LLM output does not have expected format!"



# cot_analysis()

# We need to store mistakes for each node
# Use DeepSeekR1 to check wether the reasoning path are correct and use that to train the model
# Force the LLM to focus on First Principle
# For potential RAG focus on the limits of the components
# Try marco o1?


def extract_node_data(flow_data):
    seedId = flow_data["seedId"]

    if not seedId:
      return "Please select a node for analysis."
    
    flow = flow_data["flow"]
    nodes = flow["nodes"]
    edges = flow["edges"]

    system_nodes = []
    assembly_nodes = []
    component_nodes = []

    for node in nodes:
      essential_node_info = {
        'id': node['id'],
        'type': node['type'],
        'data': node['data']
      }
      
      if essential_node_info["type"] == "systemNode":
        system_nodes.append(essential_node_info)
      elif essential_node_info["type"] == "assemblyNode":
        assembly_nodes.append(essential_node_info)
      elif essential_node_info["type"] == "componentNode":
        component_nodes.append(essential_node_info)
      else:
        print("[ERROR] Node type not recognized.")

    return seedId, system_nodes, assembly_nodes, component_nodes



edges = [{'id': 'e1-2', 'source': '1', 'target': '2'}, {'id': '2', 'source': '1', 'target': '2'}, {'id': '3', 'source': '1', 'target': '3'}, {'id': '4', 'source': '2', 'target': '4'}, {'id': '5', 'source': '1', 'target': '5'}, {'id': '6', 'source': '1', 'target': '6'}]

system_nodes = [
  {'id': '1', 'type': 'systemNode', 'data': {'label': 'node1', 'identifier': 'Cooling System'}}
  ]

assembly_nodes = [
  {'id': '2', 'type': 'assemblyNode', 'data': {'label': 'node2', 'identifier': 'Radiator', 'func': 'Cool down water'}}, 
  {'id': '3', 'type': 'assemblyNode', 'data': {'label': 'node3', 'identifier': 'Hose', 'func': 'Distribute water between engine block and radiator'}},
  {'id': '5', 'type': 'assemblyNode', 'data': {'label': 'node5', 'identifier': 'Water pump', 'func': 'Generate water flow'}}, 
  {'id': '6', 'type': 'assemblyNode', 'data': {'label': 'node6', 'identifier': 'Thermostat', 'func': 'Regulates if water flows through radiator or not. Thereby ensuring the water temperature is in the optimal range.'}}
  ]

component_nodes = [
  {'id': '4', 'type': 'componentNode', 'data': {'label': 'node4', 'identifier': 'Blower fan', 'func': 'Create air flow for improved heat exchange'}}
  ]