// Import router to allow multiple webpages website
import { Routes, Route } from "react-router-dom";

// Import react functionality
import { useState, useEffect } from 'react'
import { 
  ReactFlowProvider,
 } from "@xyflow/react";

// Import pages
import Flow from "./pages/Flow";
import FMEATable from "./pages/Table";

const SOCKET_URL = 'ws://127.0.0.1:5000/ws';

const initialFaults = [{
  _id: "123",
  nodeID: "1",
  possibleFault: "Leackage",
  possibleConsequence: "Wetness", 
  possibleCause: "Brittle Material"
}, {
  _id: "456",
  nodeID: "2",
  possibleFault: "Blank wire",
  possibleConsequence: "Electrocution",
  possibleCause: "Brittle Insolation"
}]


function App() {
  // Websocket states
  const [socket, setSocket] = useState(null);
  const [response, setResponse] = useState("");

  // Websocket handling
  useEffect(() => {
    const ws = new WebSocket(SOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      // Get response from backend
      // console.log('Message from server:', event.data);
      setResponse(JSON.parse(event.data));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);


  // DUMMY STATE!
  const [faults, setFaults] = useState(initialFaults);

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
            element={<FMEATable faults={faults} onFaultUpdate={handleFaultUpdate}/>}
          />
        </Routes>
    </div>
  )
}


export default App;