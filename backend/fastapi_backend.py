from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from analysis import cot_analysis
import json
from bson.json_util import dumps
from bson import ObjectId 
from contextlib import asynccontextmanager
import logging
import pymongo

# Setup logger
# Important to get formated outputs in terminal
logging.basicConfig(
  level=logging.INFO,
  format="%(name)s - %(levelname)s: %(message)s",
)

logger = logging.getLogger(__name__)

# Handle connection to mongodb database
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to mongodb
    app.client = pymongo.MongoClient("mongodb://localhost:27017/")
    app.db = app.client["fmea"]

    logger.info("Connected to MongoDB")

    yield
    
    # Disconnect from mongodb when connection is closed
    app.client.close() # TODO: Recheck if correct

    logger.info("Disconnected from MongoDB")
  
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
# Important to allow communication between localhost and computer
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Receive message and extract communication type
            message = await websocket.receive_text()
            message = json.loads(message)
            com_type = message["comType"]
      
            # Perform actions based on communication type
            match com_type:
                # Frontend requests analysis from backend
                # Analyse data and send extracted info back to frontend
                case "requestAnalysis": 
                    logger.info("User requests analysis")

                    # Process data
                    analysis = cot_analysis(message)

                    # Add communication type to result
                    analysis["comType"] = "analysisResponse"

                    # Send result of analysis back to frontend
                    await websocket.send_json(analysis)

                    logger.info("Analysis sent to frontend")

                # User accepts fault in frontend, faults need to be added in the database
                case "acceptFault":
                    logger.info("User accepted/added new fault")

                    # Get accepted fault
                    accepted_fault = message["matchingNode"]
   
                    # Filter out all key-value pairs except for id, data
                    accepted_fault = filter(lambda item: item[0] in {'id', 'data'}, accepted_fault.items())
                    accepted_fault = dict(accepted_fault)
                    node_id = {"nodeID": accepted_fault["id"]}

                    # Filter data further
                    data = accepted_fault["data"]
                    data = filter(lambda item: item[0] not in {'label'}, data.items())
                    data = dict(data)
                    
                    # Add node to the beginning of the dictionary
                    fault_dict = dict(node_id, **data)

                    # Access fault collection
                    fault_col = app.db["faults"]

                    # Add fault_dict to the collection
                    fault_col.insert_one(fault_dict)

                    # Get all elements and convert from BSON to JSON
                    faults = fault_col.find({})
                    faults_json = dumps(faults)

                    # Define payload
                    payload = {
                        "comType": "faultsResponse",
                        "faults": faults_json,
                    }

                    await websocket.send_json(payload)

                    logger.info("New fault successfully added to database")

                case "requestFaults":
                    logger.info("User requests faults")

                    # Access faults
                    fault_col = app.db["faults"]

                    # Get all elements and convert from BSON to JSON
                    faults = fault_col.find({})
                    faults_json = dumps(faults)

                    # Define payload
                    payload = {
                        "comType": "faultsResponse",
                        "faults": faults_json,
                    }

                    # Send data to frontend
                    await websocket.send_json(payload)

                    logger.info("Fault request successfull!")

                case "updateFaults":
                    logger.info("User requests update of faults as they have been changed in the Table (frontend)")

                    # Get faults
                    updated_faults = message["faults"]

                    # Access faults
                    fault_col = app.db["faults"]
                    
                    # Define upsert operation
                    bulk_operations = [
                        pymongo.UpdateOne(
                            {'_id': ObjectId(fault['_id'])},  # Convert string to ObjectId here
                            {'$set': {                        # Convert ID in the update document too
                                **fault,
                                '_id': ObjectId(fault['_id'])
                            }},
                            upsert=True # upsert: If the id is the same update, if not insert
                        ) 
                        for fault in updated_faults
                    ]

                    # Update collection
                    await fault_col.bulk_write(bulk_operations)

                    # Define payload
                    payload = {
                        "comType": "faultsUpdate",
                    }

                    await websocket.send_json(payload)

                    logger.info("Updated faults as they have changed in the Table (frontend)")

                case "requestFlow":
                    logger.info("User requests most recent flow")

                    # Open flow collection
                    flow_col = app.db["flows"]

                    # Get last entry
                    last_flow = flow_col.find().sort('_id', -1).limit(1)
                    json_flow = dumps(last_flow[0])

                    # Remove _id 
                    json_flow = json.loads(json_flow)
                    json_flow = filter(lambda item: item[0] not in {'_id'}, json_flow.items())
                    json_flow = dict(json_flow)

                    # Define payload
                    payload = {
                        "comType": "restoreResponse",
                        "flow": json_flow,
                    }

                    await websocket.send_json(payload)

                    logger.info("Sent most recent flow to frontend")

                case "saveFlow":
                    logger.info("User requests to save current flow")

                    # Access flow collection
                    flow_col = app.db["flows"] 

                    # Get flow from message
                    flow = message["flow"]

                    # Insert flow into flow collection
                    flow_col.insert_one(flow)

                    await websocket.send_json("Saved flow to database")

                    logger.info("Saved flow to database")

    except Exception as e:
        logger.error(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
