// Import router to allow multiple webpages website
import { Routes, Route } from "react-router";

// Import react functionality
import { useState } from 'react'

// Import pages
import FlowWithProvider from "./Flow";
import FMEATable from "./Table";

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
            path="/"
            element={<FlowWithProvider/>}
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