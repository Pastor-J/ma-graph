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

from langchain_ollama import ChatOllama
import json
llm_json_mode = ChatOllama(model="deepseek-r1:8b", temperature=0, format="json")
llm = ChatOllama(model="deepseek-r1:1.5b", temperature=0.4)

predicted = {
  "Component node 4 exhibits fatigue failure due to cyclic loading, leading to cracks in its structure.",
  "The component node 4, being the Blower Fan, may experience bearing failure due to prolonged use, causing reduced airflow and potential system overheating.",
  "The component node 4, being the Blower Fan, may experience motor winding wear due to prolonged use, resulting in reduced airflow and inadequate heat exchange within the system.",
  "Component node 4, being the Blower Fan, may experience hub fatigue failure due to cyclic loading, leading to cracks and reduced cooling efficiency within the system.",
  "The component node 4 may experience motor winding insulation failure due to environmental factors, leading to reduced airflow and potential system overheating."
  }

def cot_analysis():
  p = f"""
    You are an AI-Assitant for Failure Mode and Effects Analysis with focus on Systems. Your goal is to find a possbile MECHANICAL fault for the Component Node with id: 4 based on a graph which describes a system.

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


    analysis["possibleFault"] = possible_fault
    analysis["possibleConsequences"] = consequences
    analysis["reasoning"] = reasoning

    return analysis
  
  else:
    return "[ERROR] LLM output does not have expected format!"



# cot_analysis()

# We need to store mistakes for each node
# Use DeepSeekR1 to check wether the reasoning path are correct and use that to train the model
# Force the LLM to focus on First Principle
# For potential RAG focus on the limits of the components