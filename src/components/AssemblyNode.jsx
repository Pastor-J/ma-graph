import { Handle, Position } from '@xyflow/react'
import './AssemblyNode.css'

function AssemblyNode() {
  return (
    <>
      <Handle type="target" position={Position.Left}></Handle>
      <div className="assembly-node-container">
        <label htmlFor='text'></label>
        <input
          id='text'
        />
      </div>
      <Handle type="source" position={Position.Right}></Handle>
    </>
  );
}

export default AssemblyNode;