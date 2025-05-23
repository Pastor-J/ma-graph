from langchain_ollama import ChatOllama
from pymongo import MongoClient
from pydantic import BaseModel, ValidationError
import logging
import time

# Setup logger
# Important to get formated outputs in terminal
logging.basicConfig(
  level=logging.INFO,
  format="%(name)s - %(levelname)s: %(message)s",
)

logger = logging.getLogger(__name__)

# Setup Pydantic
# Important to verify if LLM output comforms to expected format
class Analysis(BaseModel):
  nodeID: str
  possibleFault: str
  possibleConsequence: str
  reasoning: str 

# Initialize LLM
llm = ChatOllama(model="deepseek-r1:7b", temperature=0.1) # DeepSeek-R1-Distill-Qwen-7B
# llm = ChatOllama(model="deepseek-r1:8b", temperature=0.1) # DeepSeek-R1-Distill-Llama-8B

# Initialize connection to MongoDB database
# Important to get faults which have already been predicted
uri = "mongodb://localhost:27017/"
client = MongoClient(uri)

try:
    client.admin.command("ping")
    logger.info("Connected successfully")

except Exception as e:
    raise Exception(
        "The following error occurred: ", e)

fmea = client["fmea"]
fault_col = fmea["faults"]

# CoT: Chain of Thought
def cot_analysis(flow_data):
  # Extract flow information
  seedId, system_nodes, assembly_nodes, component_nodes, edges = extract_node_data(flow_data=flow_data)

  # Find all entries in databse with matching node id
  cursor = fault_col.find({"nodeID": str(seedId)})

  # Extract all faults which have already been predicted for the given node
  predicted = set() # Warning: Possible commands could be injected here!

  for element in cursor:
    fault = element["fault"]
    predicted.add(fault)
  # TODO: Add to prompt that faults are derived from functions
  p = f"""
    You are an AI-Assistant for Failure Mode and Effects Analysis with focus on Systems. Your goal is to find a possible fault from first principles perspective for the Component Node with id: {seedId} based on a graph which describes a system. Make sure to thoroughly understand the component nodes role within the system.

    For the possible fault: 
      Please return a SHORT and CONCISE sentence describing that fault and mark it with <fault></fault>
      Furthermore please return a SHORT and CONCISE sentence describing the consequence of that fault and mark it with <consequence></consequence>.
      In the end I want ONLY TWO paragraphs marked by <fault></fault> and <consequence></consequence>.

    Make sure to predict faults which are very different from those described in the following set: {predicted}. This is VERY important!
    
    The system is described by a tree graph with three levels:
      Level 1 System Nodes: {system_nodes}
      Level 2 Assembly Nodes: {assembly_nodes}
      Level 3 Component Nodes: {component_nodes}
      
      These nodes are connected via edges which are defined via the ids of the source and target nodes.
      Edges: {edges}
  """

  # Try the analysis for a maximum of three times
  for i in range(3):
    try: 
      logger.info(f"Trying analysis: {i+1}/3")

      # Get prediction from LLM 
      start = time.time()
      msg = llm.invoke(p)
      end = time.time()
      logger.info(f"Prediction took: {(end - start):.2f} s")
      
      # Format response
      response = msg.content
      analysis = format_response(response, seedId)
 
      # Check response, if ValidationError, the prediction will start again. Max 3 times.
      Analysis(**analysis)
      logger.info("Analysis successfull!")
      return analysis

    except ValidationError as e:
      logger.exception(f"Description: {e}. Restarting process: {i+1}/3")
      continue

def extract_node_data(flow_data):
  seedId = flow_data["seedId"]

  if not seedId:
    return logger.error("Please select a node for analysis.")
  
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
      logger.error("[ERROR] Node type not recognized.")

  return seedId, system_nodes, assembly_nodes, component_nodes, edges

def format_response(content, seedId):
  # Define identifiers delimiting the paragraphs
  start_think = "<think>"
  end_think = "</think>"

  start_fault = "<fault>"
  end_fault = "</fault>"

  start_consequence = "<consequence>"
  end_consequence = "</consequence>"

  # Get indexes delimiting the contents of the paragraphs
  idx_start_think = content.find(start_think)
  idx_end_think = content.find(end_think, idx_start_think + len(start_think))

  idx_start_fault = content.find(start_fault)
  idx_end_fault = content.find(end_fault, idx_start_fault + len(start_fault))

  idx_start_consequence = content.find(start_consequence)
  idx_end_consequence = content.find(end_consequence, idx_start_consequence + len(start_consequence))

  # Get content of paragraphs based on indexes
  reasoning = content[idx_start_think + len(start_think):idx_end_think]
  possible_fault = content[idx_start_fault + len(start_fault):idx_end_fault]
  possible_consequence = content[idx_start_consequence + len(start_consequence):idx_end_consequence]
  
  analysis = {
    "nodeID": seedId,
    "possibleFault": possible_fault,
    "possibleConsequence": possible_consequence,
    "reasoning": reasoning  
  }

  return analysis