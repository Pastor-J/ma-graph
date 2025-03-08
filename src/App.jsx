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
    // Establish WebSocket connection
    const ws = new WebSocket(SOCKET_URL);
    socket.current = ws;

    // Define behavior when connection is opened
    ws.onopen = () => {
      console.log('WebSocket connection established');

      // Request faults from database when opening the connection
      const payload = {
        "comType": "requestFaults",
      }

      ws.send(JSON.stringify(payload))
      console.log('Requested faults via WebSocket Connection')

      // Update payload 
      payload["comType"] = "requestFlow";

      ws.send(JSON.stringify(payload));
      console.log('Requested flow via Websocket Connection');
    };

    // Define behaviour when new message is received from backends
    ws.onmessage = (event) => {
      // Get response from backend
      const parsedData = JSON.parse(event.data);
      const comType = parsedData["comType"];

      switch(comType) {
        case "analysisResponse":
          setResponse(parsedData);
          console.log(parsedData);
          break;

        case "faultsUpdate":
          console.log("Request update of faults in database");
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

          console.log("Sucessfully updated faults!"); 
          break;
        }

        case "restoreResponse": {
          // TODO: MongoDB -> localstorage -> APP. Bit confusing I think
          const flow = parsedData["flow"];
          localStorage.setItem('flow', JSON.stringify(flow));
          console.log("Set local storage with most recent flow!");
          break;
        }
      }
    };

    // Define behaviour in case of an error
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Define behaviour when connection is closed
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

  // Function handling user inputs in FMEA-Table
  const handleFaultUpdate = (updatedFault) => {
    setFaults(faults.map(fault => 
      fault._id === updatedFault._id ? updatedFault : fault
    ));
  };  
  

  return (
    <div className="App">
        <Routes>
          <Route 
            index
            element={
              <ReactFlowProvider>
                <Flow 
                  socket={socket} 
                  response={response}
                />
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