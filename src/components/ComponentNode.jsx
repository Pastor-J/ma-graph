import { Handle, Position } from '@xyflow/react';
import './ComponentNode.css'
 
// Among other args id, data can be accessed here. See ReactFlow documentation "NodeProps" for more info
function ComponentNode({ id, data }) {

  return (
    <>
      <Handle type="target" position={Position.Left}></Handle>
      <div className="component-node-container">
        <label htmlFor='text'></label>
        <input
          className="identifier-input-field"
          value={data.identifier || ''} 
          onChange={(event) => data.onChange(event, "identifier", id)}
          placeholder='Component'
        />

        <input 
          className="function-input-field"
          value={data.func || ''}
          onChange={(event) => data.onChange(event, "func", id)}
          placeholder='Function'
        />

        <input 
          className="fault-input-field"
          value={data.fault || ''}
          onChange={(event) => data.onChange(event, "fault", id)}
          placeholder='Possible Fault'
        />

        <label className="file-upload-label">Specifications</label>
        <input 
          className='file-upload-field'
          type='file'
        />
      </div>
    </>
  );
} 

export default ComponentNode;