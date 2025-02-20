// Import router to allow multiple webpages website
import { Routes, Route } from "react-router-dom";

// Import react functionality
import { useState } from 'react'
import { 
  ReactFlowProvider,
  useNodesState,
 } from "@xyflow/react";

// Import pages
import Flow from "./pages/Flow";
import FMEATable from "./pages/Table";


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
  // DUMMY STATE!
  const [faults, setFaults] = useState(initialFaults);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);

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
                <Flow 
                  nodes={nodes} 
                  setNodes={setNodes} 
                  onNodesChange={onNodesChange}
                />
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