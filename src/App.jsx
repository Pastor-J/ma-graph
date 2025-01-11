import { useState, useCallback, useEffect } from 'react';
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

const SOCKET_URL = 'ws://127.0.0.1:5000';

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

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState(null);
  const { screenToFlowPosition } = useReactFlow(); 
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(SOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setSocket(ws);

    // Cleanup on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);


  let id = Number(nodes.length) + 1;
  const getId = () => `${id++}`


  const onConnect = useCallback(
    (params) => setEdges((eds) => {
      console.log(params);
      return addEdge(params, eds);
    }), [setEdges],
  )

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem('flow', JSON.stringify(flow));
    }
  }, [rfInstance])

  const onRestore = useCallback(() => {
    const restoreFlow = () => {
      const flow = JSON.parse(localStorage.getItem('flow'));
 
      if (flow) {
        // const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        // setViewport({ x, y, zoom });
      }
    };
 
    restoreFlow();   
  }, [setNodes, setEdges]);

  // const onAnalyze = useCallback(() => {
  //   if (rfInstance) {
  //     const flow = rfInstance.toObject();

  //     try {
  //       //TODO: Async Await
  //       fetch('http://127.0.0.1:5000/api/analyze', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify(flow),
  //       });
  //       console.log('data send');
  //     } catch(error) {
  //       console.log(`Unexpected Error: ${error}`);
  //     }

  //   }
  // }, [rfInstance]); // useCallback caches functions and only updates it if elems in dependency array change

  const onAnalyze = useCallback(() => {
    if (rfInstance && socket && socket.readyState === WebSocket.OPEN) {
      const flow = rfInstance.toObject(); // Convert flow data to an object
      socket.send(JSON.stringify(flow)); // Send flow data as JSON
      console.log('Flow data sent via WebSocket');
    } else {
      console.error('WebSocket is not connected');
    }
  }, [rfInstance, socket]);

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
            <button onClick={onSave}>Save</button>
            <button onClick={onRestore}>Restore</button>
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