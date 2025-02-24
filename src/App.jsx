// Import router to allow multiple webpages website
import { Routes, Route } from "react-router-dom";

// Import react functionality
import { useState, useEffect, useRef } from 'react'
import { 
  ReactFlowProvider,
 } from "@xyflow/react";

// Import pages
import Flow from "./pages/Flow";
import FMEATable from "./pages/Table";

const SOCKET_URL = 'ws://127.0.0.1:5000/ws';

function App() {
  // Websocket 
  const socket = useRef(null); // Use ref instead of state because socket remains constant
  const [response, setResponse] = useState("");

  // States for faults
  const [faults, setFaults] = useState([]);

  // Websocket handling
  useEffect(() => {
    const ws = new WebSocket(SOCKET_URL);
    socket.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');

      // Request faults from database when opening the connection
      const payload = {
        "comType": "requestFaults",
      }

      // TODO: Request flow from database when opening the connection

      ws.send(JSON.stringify(payload))
      console.log('Requested faults via WebSocket Connection')
    };

    ws.onmessage = (event) => {
      // Get response from backend
      const parsedData = JSON.parse(event.data)
      const comType = parsedData["comType"];

      switch(comType) {
        case "analysisResponse":
          setResponse(JSON.parse(event.data));
          break;

        case "faultsUpdate":
          console.log("success!");
          break;

        case "faultsResponse": {
          // Get faults from parsedData
          const faults = JSON.parse(parsedData.faults);

          // Fix representation of _id. 
          // TODO: Why not format it correctly when sending the data?
          const faultsFormatted = faults.map((fault) => {
            return {
              ...fault,
              _id: fault._id.$oid.toString(),
            };
          });
          
          // Update faults-state
          setFaults(faultsFormatted);
          break;
        }

        case "restoreResponse":
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  const handleFaultUpdate = (updatedFault) => {
    setFaults(faults.map(fault => 
      fault._id === updatedFault._id ? updatedFault : fault
    ));
    // Here you could also send the update to your backend
  };  

  return (
    <div className="App">
        <Routes>
          <Route 
            index
            element={
              <ReactFlowProvider>
                <Flow socket={socket} response={response}/>
              </ReactFlowProvider>
            }
          />
          <Route
            path="fmea-table"
            element={<FMEATable 
              faults={faults} 
              onFaultUpdate={handleFaultUpdate} 
              socket={socket}
            />}
          />
        </Routes>
    </div>
  )
}


export default App;