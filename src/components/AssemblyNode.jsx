import { Handle, Position } from '@xyflow/react'
import './AssemblyNode.css'
import { useContext } from 'react';
import { NodeContext } from './context';

// Among other args id, data can be accessed here. See ReactFlow documentation "NodeProps" for more info
function AssemblyNode({ id, data }) {
  // Get important function for interactions from NodeContext
  // Ignore onAccept and onAnalyze as they are only important for the ComponentNode
  const [, , onChange] = useContext(NodeContext); 

  return (
    <>
      <Handle type="target" position={Position.Left}></Handle>
      <div className="assembly-node-container">
        <label htmlFor='text'></label>
        <input
          className="identifier-input-field"
          value={data.identifier || ''}
          onChange={(event) => onChange(event, "identifier", id)}
          placeholder='Assembly Component'
        />

        <input 
          className="function-input-field"
          value={data.func || ''}
          onChange={(event) => onChange(event, "func", id)}
          placeholder='Function'
        />

      </div>
      <Handle type="source" position={Position.Right}></Handle>
    </>
  );
}

export default AssemblyNode;