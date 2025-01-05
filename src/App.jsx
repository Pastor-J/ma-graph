import React, { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider,
  useReactFlow,
  Controls,
  useNodesState, 
  useEdgesState, 
  addEdge,
  MiniMap,
  Background,
  Panel,
 } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ComponentNode from './ComponentNode';

const nodeTypes = { componentNode: ComponentNode};

const initialNodes = [
  { id: '1', type: 'componentNode', position: {x: 150, y: 250}, data: { label: 'node1', function: 'Example Function 1'} },
  { id: '2', type: 'componentNode', position: {x: 400, y: 250}, data: { label: 'node2', function: 'Example Function 2'} },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2'}];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => {
      console.log(params);
      return addEdge(params, eds);
    }), [setEdges],
  )

  const onAnalyze = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();

      try {
        fetch('api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(flow),
        });
        console.log('data send');
      } catch(error) {
        console.log(`Unexpected Error: ${error}`);
      }

    }
  }, [rfInstance]);

  return (
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={setRfInstance}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
      >
        <Panel position='top-right'>
          <button onClick={onAnalyze}>Analyze</button>
        </Panel>
      </ReactFlow>
  );
};

export default () => (
  <div style={{ width: '100vw', height: '100vh'}}>
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  </div>
);