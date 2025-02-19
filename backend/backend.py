# from flask import Flask, request, jsonify
# from flask_cors import CORS
from analysis import simple_analysis, cot_analysis

import asyncio
import websockets
import json

async def analyze(websocket, path):
    async for message in websocket:
        # Parse the received flow data
      
        flow_data = json.loads(message)
        # print("Received flow data:", flow_data)
        with open('data.json', 'w') as file:
            json.dump(flow_data, file, indent=4)

        # result = simple_analysis(flow_data=flow_data)
        result = cot_analysis(flow_data)
        result = json.dumps(result)
        # Send analysis result back to the client
        await websocket.send(result)

# Start the WebSocket server
start_server = websockets.serve(analyze, "127.0.0.1", 5000)

print("WebSocket server is running on ws://127.0.0.1:5000")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

# TODO: Highlight currently selected node and cell and use this as starting point for analysis