import { Handle, Position } from '@xyflow/react'

function AssemblyNode() {
  return (
    <>
      <Handle type="target" position={Position.Left}></Handle>
      <div>
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