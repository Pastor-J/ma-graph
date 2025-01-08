import { Handle, Position } from '@xyflow/react'
import './AssemblyNode.css'
import { useCallback, useState } from 'react';

function AssemblyNode({ data }) {
  const [identifier, setIdentifier] = useState('');
  const [func, setFunc] = useState('');

  const onIdentifierChange = useCallback((evt) => {
    setIdentifier(evt.target.value);
    data.identifier = evt.target.value;
  }, [data])

  const onIdentifierKeyDown = useCallback((evt) => {
    if (evt.key === 'Enter') {
      data.identifier = identifier;
      console.log(data);
    }
  }, [identifier, data])

  const onFuncChange = useCallback((evt) => {
    setFunc(evt.target.value);
    data.func = evt.target.value;
  }, [data])

  const onFuncKeyDown = useCallback((evt) => {
    if (evt.key === 'Enter') {
      data.func = func;
      console.log(data)
    }
  }, [func, data])

  return (
    <>
      <Handle type="target" position={Position.Left}></Handle>
      <div className="assembly-node-container">
        <label htmlFor='text'></label>
        <input
          className="identifier-input-field"
          onKeyDown={onIdentifierKeyDown}
          value={identifier}
          onChange={onIdentifierChange}
          placeholder='Assembly Component'
        />

        <input 
          className="function-input-field"
          onKeyDown={onFuncKeyDown}
          value={func}
          onChange={onFuncChange}
          placeholder='Function'
        />

      </div>
      <Handle type="source" position={Position.Right}></Handle>
    </>
  );
}

export default AssemblyNode;