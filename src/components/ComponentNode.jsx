import { useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import './ComponentNode.css'
 
function ComponentNode() {
  const onKeyDown = useCallback((evt) => {
    if (evt.key === 'Enter') {
      console.log('Pressed Enter');
    };
  }, []);
 
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div className="component-node-container">
        <label htmlFor="text"></label>
        <input 
          id="text" 
          name="text" 
          onKeyDown={onKeyDown} className="nodrag" 
        />
      </div>
    </>
  );
} 

export default ComponentNode;