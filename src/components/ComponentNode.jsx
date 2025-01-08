import { useCallback, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import './ComponentNode.css'
 
function ComponentNode({ data }) {
  const [identifier, setIdentifier] = useState('');
  const [func, setFunc] = useState('');
  const [fault, setFault] = useState('');

  const onIdentifierChange = useCallback((evt) => {
    setIdentifier(evt.target.value);
  }, [])

  const onIdentifierKeyDown = useCallback((evt) => {
    if (evt.key === 'Enter') {
      data.identifier = identifier;
      console.log(data);
    }
  }, [identifier, data])

  const onFuncChange = useCallback((evt) => {
    setFunc(evt.target.value);
  }, [])

  const onFuncKeyDown = useCallback((evt) => {
    if (evt.key === 'Enter') {
      data.func = func;
      console.log(data)
    }
  }, [func, data])

  const onFaultChange = useCallback((evt) => {
    setFault(evt.target.value);
  }, [])

  const onFaultKeyDown = useCallback((evt) => {
    if (evt.key === 'Enter') {
      data.fault = fault;
    }
  }, [fault, data])

  return (
    <>
      <Handle type="target" position={Position.Left}></Handle>
      <div className="component-node-container">
        <label htmlFor='text'></label>
        <input
          className="identifier-input-field"
          onKeyDown={onIdentifierKeyDown}
          value={identifier}
          onChange={onIdentifierChange}
          placeholder='Component'
        />

        <input 
          className="function-input-field"
          onKeyDown={onFuncKeyDown}
          value={func}
          onChange={onFuncChange}
          placeholder='Function'
        />

        <input 
          className="fault-input-field"
          onKeyDown={onFaultKeyDown}
          value={fault}
          onChange={onFaultChange}
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