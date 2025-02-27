import { Handle, Position, NodeToolbar } from '@xyflow/react';
import './ComponentNode.css'
import { useContext } from 'react';
import { NodeContext } from './context';
 
// Among other args id, data can be accessed here. See ReactFlow documentation "NodeProps" for more info
function ComponentNode({ id, data }) {
  // Get important functions for interactions from NodeContext
  const [onAccept, onAnalyze, onChange] = useContext(NodeContext)

  return (
    <>
      <NodeToolbar isVisible={data.toolbarVisible} position={data.toolbarPosition}>
        <button 
          onClick={() => (data.fault == '' || !data.fault) ? onAnalyze(id) : onAccept(id)}>
          {(data.fault == '' || !data.fault) ? "Analyze" : "Accept"}
        </button>
      </NodeToolbar>
      <Handle type="target" position={Position.Left}></Handle>
      <div className="component-node-container">
        <label htmlFor='text'></label>
        <input
          className="identifier-input-field"
          value={data.identifier || ''} 
          onChange={(event) => onChange(event, "identifier", id)}
          placeholder='Component'
        />

        <input 
          className="function-input-field"
          value={data.func || ''}
          onChange={(event) => onChange(event, "func", id)}
          placeholder='Function'
        />

        <input 
          className="fault-input-field"
          value={data.fault || ''}
          onChange={(event) => onChange(event, "fault", id)}
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