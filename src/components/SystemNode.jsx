import { Handle, Position } from '@xyflow/react';
import './SystemNode.css';
import { useState, useCallback} from 'react';

function SystemNode({ data }) {
  const [identifier, setIdentifier] = useState(data.identifier || '');

  const onSystemChange = useCallback((evt) => {
    setIdentifier(evt.target.value);
    data.identifier = evt.target.value;
  }, [data])

  // const onSystemKeyDown = useCallback((evt) => {
  //   if (evt.key === 'Enter') {
  //     data.identifer = system;
  //   }
  // }, [system, data])

  return (
    <>
      <Handle type="source" position={Position.Right} />
      <div className="system-node-container">
        <label htmlFor='text'></label> 
        <input
          className='system-input-field'
          placeholder='System Component'
          onChange={onSystemChange}
          value={identifier}
          // onKeyDown={onSystemKeyDown}
        />

      </div>
    </>
  );
}

export default SystemNode;