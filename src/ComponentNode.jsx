import { useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
 
function ComponentNode({ data }) {
  const onKeyDown = useCallback((evt) => {
    if (evt.key === 'Enter') {
      console.log('Pressed Enter');
    };
  }, []);
 
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div>
        <label htmlFor="text"></label>
        <input 
          id="text" 
          name="text" 
          onKeyDown={onKeyDown} className="nodrag" 
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
} 

export default ComponentNode;