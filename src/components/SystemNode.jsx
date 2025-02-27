import { Handle, Position } from '@xyflow/react';
import { useContext } from 'react';
import { NodeContext } from './context';
import './SystemNode.css';

// Among other args id, data can be accessed here. See ReactFlow documentation "NodeProps" for more info
function SystemNode({ id, data }) {
  // Get important function for interactions from NodeContext
  // Ignore onAccept and onAnalyze as they are only important for the ComponentNode
  const [, , onChange] = useContext(NodeContext);

  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div className="system-node-container">
        <label htmlFor='text'></label> 
        <input
          className='system-input-field'
          placeholder='System Component'
          onChange={(event) => onChange(event, "identifier", id)}
          value={data.identifier || ''}
        />

      </div>
    </>
  );
}

export default SystemNode;