import PropTypes from 'prop-types'
import './Table.css'
// Link element to switch between webpages efficiently
import { Link } from "react-router-dom";

function TitleRow() {
  return (
    <tr className="title-row">
      <th>ID</th>
      <th>Possible Fault</th>
      <th>Possible Consequence</th>
      <th>Possible Cause</th>
    </tr>
  )
}

function FaultRow({ fault, onFaultChange }) {

  const handleChange = (field, value) => {
    onFaultChange({
      ...fault,
      [field]: value
    });
  };

  return (
    <tr>
      <td>
        <textarea 
          value={fault.nodeID}
          onChange={(change) => handleChange("nodeID", change.target.value)}
          className="fmea-table-input-box"
        />
      </td>
      <td>
        <textarea
          value={fault.fault}
          onChange={(change) => handleChange("fault", change.target.value)}
          className="fmea-table-input-box"
        />
      </td>
      <td>
        <textarea
          value={fault.possibleConsequence || ''}
          onChange={(change) => handleChange("possibleConsequence", change.target.value)}
          className="fmea-table-input-box"
        />
      </td>
      <td>
        <textarea 
          value={fault.possibleCause || ''}
          onChange={(change) => handleChange("possibleCause", change.target.value)}
          className="fmea-table-input-box"
        />
      </td>
    </tr>
  )
}

FaultRow.propTypes = {
  fault: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    nodeID: PropTypes.string.isRequired,
    fault: PropTypes.string.isRequired,
    possibleConsequence: PropTypes.string, // not required, user can insert fault manually
    possibleCause: PropTypes.string, // not required, user can insert fault manually
  }).isRequired,
};

function FMEATable({ faults, onFaultUpdate, socket}) {
  const handleFaultChange = (updatedFault) => {
    onFaultUpdate(updatedFault);
  }
  const rows = []

  faults.forEach(fault => {
    rows.push(
      <FaultRow 
        fault={fault} 
        key={fault._id} // The key needs to provided, so React can render the table efficiently
        onFaultChange={handleFaultChange}/> 
    )
  });

  const onClick = () => {
    // Check websocket connection
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const payload = {
      comType: 'updateFaults',
      faults: faults,
    };

    socket.current.send(JSON.stringify(payload)); // Send flow data as JSON
    console.log('Flow data sent via WebSocket');
  }

  return (
    <div style={{ width: '100vw', height: '100vh'}}>
      <button onClick={onClick} className="table-save-button">Save</button>
      <Link to="/" className="flow-link-button">Flow</Link>
      <div className="fmea-table-container">
        <table>
          <thead>
            <TitleRow />
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

FMEATable.propTypes = {
  faults: PropTypes.arrayOf(
    PropTypes.shape({
      nodeID: PropTypes.string.isRequired,
      fault: PropTypes.string,
      possibleConsequence: PropTypes.string,
    })
  ).isRequired,
};

export default FMEATable;



