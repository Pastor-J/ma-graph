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

import './App.css'

import ComponentNode from './components/ComponentNode';
import SystemNode from './components/SystemNode';
import AssemblyNode from './components/AssemblyNode';
import Chatbox from './components/Chatbox';

const SOCKET_URL = 'ws://127.0.0.1:5000';

const nodeTypes = { 
  componentNode: ComponentNode, 
  systemNode: SystemNode,
  assemblyNode: AssemblyNode
};

function App() {
  // Set states for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Set state describing the flow. Important to safe and load the flow
  const [rfInstance, setRfInstance] = useState(null);
  const { screenToFlowPosition } = useReactFlow(); 

  // Initialize states for websocket, response from backend and currently selected node
  const [socket, setSocket] = useState(null);
  const [response, setResponse] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Function for handling user inputs
  const onChange = useCallback((event, field, nodeID) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== nodeID) {
          return node;
        }

        // Get user input
        const user_input = event.target.value;

        // Update node with user input
        return {
          ...node,
          data: {
            ...node.data,
            [field]: user_input,
          },
        };
      })
    );
  }, [setNodes]);

  // Insert initial system node
  useEffect(() => {
    setNodes([
      { id: '1', 
        type: 'systemNode', 
        position: {x: 150, y: 250}, 
        data: { identifier: '', onChange: onChange } 
      }
    ]); 
  }, [onChange, setNodes]);
  
  // Websocket
  useEffect(() => {
    const ws = new WebSocket(SOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket connection established');
    };

    ws.onmessage = (event) => {
      // Get response from backend
      console.log('Message from server:', event.data);
      setResponse(JSON.parse(event.data));
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

  // Insert Information provided by backend into GUI
  useEffect(() => {
    if (!response || !response.nodeID) return; // Ensure response exists
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id == response.nodeID) {
          console.log("Found it!");
          return {
            ...node,
            data: {
              ...node.data,
              fault: response.possibleFault,
            }
          }
        }
        return node; 
      })
    );
  }, [response, setNodes]);
  
  //Load form localStorage on startup
  useEffect(() => {
    onRestore();
  }, [])

  // Functionality to calculate id for a new potential node
  let id = Number(nodes.length) + 1;
  const getId = () => `${id++}`

  // Function handling connections between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => {
      return addEdge(params, eds);
    }), [setEdges],
  )

  // Function saving flow to local storage
  const onSave = useCallback(() => {
    if (rfInstance) {
      // Get object describing the flow and save to local storage
      const flow = rfInstance.toObject();
      localStorage.setItem('flow', JSON.stringify(flow));
    }
  }, [rfInstance])

  // Function allowing flow to be restored from local storage
  const onRestore = useCallback(() => {
    const restoreFlow = () => {
      const flow = JSON.parse(localStorage.getItem('flow'));

      // Restore the flow. Make sure to add onChange function to data object, as functions cannot be saved to local storage
      if (flow) {
        setNodes(
          (flow.nodes || []).map(node => ({
            ...node,
            data: {
              ...node.data,
              onChange: onChange,  // Reassign function reference
            },
          }))
        );
        setEdges(flow.edges || []);
      }
    };
 
    restoreFlow();   

  }, [setNodes, setEdges, onChange]);

  // Function handling for "Analyze" Button
  const onAnalyze = useCallback(() => {
    if (rfInstance && socket && socket.readyState === WebSocket.OPEN) {
      const flow = rfInstance.toObject(); // Convert flow data to an object
      const seedId = selectedNodeId;
      const payload = {
        seedId,
        flow
      }

      socket.send(JSON.stringify(payload)); // Send flow data as JSON
      console.log('Flow data sent via WebSocket');
    } else {
      console.error('WebSocket is not connected');
    }
  }, [rfInstance, socket, selectedNodeId]);

  // Function allowing to add new nodes from the right handle of system and assembly node
  const onConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid) {
        // Get id for new node
        const id = getId();

        // Get node type from source node of new connection
        const sourceType = connectionState.fromNode.type;

        // Get position
        const { clientX, clientY} = 
          'changedTouches' in event ? event.changedTouches[0] : event;

        // Determine target node type based on source node type
        let targetType = '';

        if (sourceType == 'systemNode') {
          targetType = 'assemblyNode';
        } else if (sourceType == 'assemblyNode') {
          targetType = 'componentNode';
        };

        // Define new node. Allow modification of node by passing onChange function
        const newNode = {
          id: id,
          type: targetType,
          position: screenToFlowPosition({
            x: clientX,
            y: clientY
          }),
          data: {label: `node${id}`, onChange: onChange}
        }
        
        // Update nodes state
        setNodes((nds) => {
          return nds.concat(newNode);
        })
        
        // Update edges state
        setEdges((eds) => {
          return eds.concat({ id, source: connectionState.fromNode.id, target: id}); 
       })
      }
    }
  );

  const onNodeClick = (event, node) => {
    setSelectedNodeId(node.id);
  }

  return (
    <div style={{ width: '100vw', height: '100vh'}}>      
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
        >
          <Panel position='top-right'>
            <button className='panel-button' onClick={onAnalyze}>Analyze</button>
            <button className='panel-button' onClick={onSave}>Save</button>
            <button className='panel-button' onClick={onRestore}>Restore</button>
          </Panel>
        </ReactFlow>
        <Chatbox response={ response }/>
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