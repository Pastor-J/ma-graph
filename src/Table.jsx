import PropTypes from 'prop-types'
import './Table.css'

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
        <input 
          value={fault.nodeID}
          onChange={(change) => handleChange("nodeID", change.target.value)}
        />
      </td>
      <td>
        <input
          value={fault.possibleFault}
          onChange={(change) => handleChange("possibleFault", change.target.value)}
        />
      </td>
      <td>
        <input 
          value={fault.possibleConsequence}
          onChange={(change) => handleChange("possibleConsequence", change.target.value)}
        />
      </td>
      <td>
        <input 
          value={fault.possibleCause}
          onChange={(change) => handleChange("possibleCause", change.target.value)}
        />
      </td>
    </tr>
  )
}

FaultRow.propTypes = {
  fault: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    nodeID: PropTypes.string.isRequired,
    possibleFault: PropTypes.string.isRequired,
    possibleConsequence: PropTypes.string.isRequired,
    possibleCause: PropTypes.string.isRequired,
  }).isRequired,
};

function FMEATable({ faults, onFaultUpdate}) {
  const handleFaultChange = (updatedFault) => {
    onFaultUpdate(updatedFault);
  }

  const rows = []

  faults.forEach(fault => {
    rows.push(
      <FaultRow 
        fault={fault} 
        key={fault._id}
        onFaultChange={handleFaultChange}/> 
    )
  });

  return (
    <table>
      <thead>
        <TitleRow />
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  );
}

FMEATable.propTypes = {
  faults: PropTypes.arrayOf(
    PropTypes.shape({
      nodeID: PropTypes.string.isRequired,
      possibleFault: PropTypes.string.isRequired,
      possibleConsequence: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default FMEATable;



