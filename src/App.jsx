import { useState, useCallback } from 'react';
import { 
  ReactFlow, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Panel,
  useReactFlow,
  ReactFlowProvider
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
  { id: '1', type: 'systemNode', position: {x: 150, y: 250}, data: { label: 'node1' } }
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2'},
  { id: 'e2-3', source: '2', target: '3'}
];

let id = Number(initialNodes.length) + 1;
const getId = () => `${id++}`

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState(null);
  const { screenToFlowPosition } = useReactFlow(); 

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
        //TODO: Async Await
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

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid) {
        const id = getId();
        const type = connectionState.fromNode.type;
        const { clientX, clientY} = 
          'changedTouches' in event ? event.changedTouches[0] : event;
        let newType = '';

        if (type == 'systemNode') {
          newType = 'assemblyNode';
        } else if (type == 'assemblyNode') {
          newType = 'componentNode';
        };

        const newNode = {
          id: id,
          type: newType,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY
          }),
          data: {label: `node${id}`}
        }
        
        setNodes((nds) => {
          return nds.concat(newNode);
        })
        
        setEdges((eds) => {
          return eds.concat({ id, source: connectionState.fromNode.id, target: id}); 
       })
      }
    }
  );

  return (
    <div style={{ width: '100vw', height: '100vh'}}>      
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
        >
          <Panel position='top-right'>
            <button onClick={onAnalyze}>Analyze</button>
          </Panel>
        </ReactFlow>
    </div>
  );
};

function FlowWithProvider() {
  return (
    <ReactFlowProvider>
      <App />
    </ReactFlowProvider>
  );
}

export default FlowWithProvider;