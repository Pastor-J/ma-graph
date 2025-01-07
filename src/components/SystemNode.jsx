import { Handle, Position} from '@xyflow/react'

function SystemNode() {

  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div>
        <label htmlFor='text'></label> 
        <input 
          id="text">
        </input>

      </div>
    </>
  );
}

export default SystemNode;