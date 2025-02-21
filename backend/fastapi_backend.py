from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from analysis import simple_analysis, cot_analysis
import json
from contextlib import asynccontextmanager

# MongoDB
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient 

# Handle connection to mongodb database
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Connect to mongodb
    app.client = pymongo.MongoClient("mongodb://localhost:27017/")

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
            # Receive message
            message = await websocket.receive_text()
            flow_data = json.loads(message)
            
            # Extract communication type
            com_type = flow_data["comType"]

            # Perform actions based on communicationt ype
            match com_type:
              case "requestAnalysis":
                  # Process data
                  result = cot_analysis(flow_data)

                  # # NOTE: Just a test
                  # db = app.client["fmea"]

                  # fault_col = db.get_collection("faults")

                  # for fault in fault_col.find():
                  #     print(fault)
                  
                  # # NOTE: End

                  # Send result of analysis back to frontend
                  await websocket.send_json(result)

              case 2:
                  return "Two"
              case _:
                  return "Default case"            
            

    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
