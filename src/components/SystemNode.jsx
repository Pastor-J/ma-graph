import { Handle, Position } from '@xyflow/react';
import './SystemNode.css';

// Among other args id, data can be accessed here. See ReactFlow documentation "NodeProps" for more info
function SystemNode({ id, data }) {

  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div className="system-node-container">
        <label htmlFor='text'></label> 
        <input
          className='system-input-field'
          placeholder='System Component'
          onChange={(event) => data.onChange(event, "identifier", id)}
          value={data.identifier || ''}
        />

      </div>
    </>
  );
}

export default SystemNode;