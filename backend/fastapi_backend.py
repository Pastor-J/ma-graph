from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from analysis import simple_analysis, cot_analysis
import json
from bson.json_util import dumps
from bson import ObjectId 
from contextlib import asynccontextmanager

# MongoDB
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient 

# Handle connection to mongodb database
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to mongodb
    app.client = pymongo.MongoClient("mongodb://localhost:27017/")
    app.db = app.client["fmea"]

    print("INFO: Connected to MongoDB")

    yield
    
    # Disconnect from mongodb when connection is closed
    app.client.close() # TODO: Recheck if correct

    print("INFO: Disconnected from MongoDB")
  
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
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
                case "requestAnalysis":
                    # Process data
                    analysis = cot_analysis(message)

                    # Add communication type to result
                    analysis["comType"] = "analysisResponse"

                    # Send result of analysis back to frontend
                    await websocket.send_json(analysis)

                case "acceptFault":
                    print(message)
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

                case "requestFaults":
                    print("INFO: User requests faults")

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

                    print("INFO: Fault request successfull!")

                case "updateFaults":
                    
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
                    fault_col.bulk_write(bulk_operations)

                    # Define payload
                    payload = {
                        "comType": "faultsUpdate",
                    }

                    await websocket.send_json(payload)

                case "requestFlow":
                    print("Requested Flow")

                    await websocket.send_json("test")

                case "saveFlow":
                    # Access flow collection
                    flow_col = app.db["flows"]
                    
                    # Get last entry
                    last_flow = flow_col.find().sort('_id', -1).limit(1)
                    json_flow = dumps(last_flow[0])

                    # Remove _id 
                    json_flow = json.loads(json_flow)
                    json_flow = filter(lambda item: item[0] not in {'_id'}, json_flow.items())
                    json_flow = dict(json_flow)

                    payload = {
                        "comType": "flow",
                        "flow": json_flow,
                    }

                    await websocket.send_json(payload)

    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
