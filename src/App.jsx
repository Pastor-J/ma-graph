import { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  ReactFlowProvider,
  useNodesState, 
  useEdgesState, 
  addEdge,
  Panel,
 } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import ComponentNode from './components/ComponentNode';
import SystemNode from './components/SystemNode';
import AssemblyNode from './components/AssemblyNode';

const nodeTypes = { 
  componentNode: ComponentNode, 
  systemNode: SystemNode,
  assemblyNode: AssemblyNode
};

const initialNodes = [
  { id: '1', type: 'systemNode', position: {x: 150, y: 250}, data: { label: 'node1', function: 'Example Function 1'} },
  { id: '2', type: 'assemblyNode', position: {x: 400, y: 250}, data: { label: 'node2', function: 'Example Function 2'} },
  { id: '3', type: 'componentNode', position: {x: 650, y: 250},
  data: {label: 'node3', function: 'Example Function 3'} }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2'},
  { id: 'e2-3', source: '2', target: '3'}
];

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
        fetch('http://127.0.0.1:5000/api/analyze', {
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
    <div style={{ width: '100vw', height: '100vh'}}>      <ReactFlowProvider>
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
      </ReactFlowProvider>
    </div>
  );
};

export default App;