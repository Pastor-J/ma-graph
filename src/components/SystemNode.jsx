import { Handle, Position} from '@xyflow/react'
import './SystemNode.css'

function SystemNode() {

  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div className="system-node-container">
        <label htmlFor='text'></label> 
        <input 
          id="text">
        </input>

      </div>
    </>
  );
}

export default SystemNode;