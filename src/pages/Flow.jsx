import { 
  useState, 
  useCallback, 
  useEffect 
} from 'react';

import { 
  ReactFlow, 
  useEdgesState, 
  useNodesState,
  addEdge,
  Panel,
  useReactFlow,
 } from '@xyflow/react';

import { Link } from "react-router-dom";

// Import styling
import '@xyflow/react/dist/style.css';
import './Flow.css'

// Load custom nodes
import ComponentNode from '../components/ComponentNode';
import SystemNode from '../components/SystemNode';
import AssemblyNode from '../components/AssemblyNode';
import Chatbox from '../components/Chatbox';

// Define node types
const nodeTypes = { 
  componentNode: ComponentNode, 
  systemNode: SystemNode,
  assemblyNode: AssemblyNode
};

function Flow({socket, response}) {
  // Set states for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Set state describing the flow. Important to safe and load the flow
  const [rfInstance, setRfInstance] = useState(null);
  const {screenToFlowPosition} = useReactFlow(); 

  // Initialize states for websocket, response from backend and currently selected node
  // const [selectedNodeId, setSelectedNodeId] = useState(null);

  // Functionality to calculate id for a new potential node
  let id = Number(nodes.length) + 1; // TODO: make sure ids cannot be passed twice
  const getId = () => `${id++}`

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
  
  // Insert Information provided by backend into GUI
  useEffect(() => {
    if (!response || !response.nodeID) return; // Ensure response exists

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id == response.nodeID) {
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
  
  // Function handling for "Analyze" Button
  const onAnalyze = useCallback((nodeID) => {
    // Check websocket connection
    if (!socket.curennt || socket.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    if (rfInstance) {
      const flow = rfInstance.toObject(); // Convert flow data to an object

      const payload = {
        comType: 'requestAnalysis',
        seedId: nodeID,
        flow
      }

      socket.current.send(JSON.stringify(payload)); // Send flow data as JSON
      console.log('Flow data sent via WebSocket');
    } else {
      console.error('WebSocket is not connected');
    }
  }, [rfInstance, socket]);

  const onAccept = useCallback((id) => {
    // Check socket connection
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    // Get node with matching id
    const matchingNode = nodes.filter((node) => node.id === id)[0]
  
    // Define payload
    const payload = {
      comType: "acceptFault",
      matchingNode,
    }

    socket.current.send(JSON.stringify(payload))
    console.log('Accepted fault send via WebSocket')
  }, [nodes, socket])

  // Function handling connections between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => {
      return addEdge(params, eds);
    }), [setEdges],
  )

  // Function saving flow to local storage
  const onSave = useCallback(() => {
    // Check socket connection
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    if (rfInstance) {
      // Get object describing the flow and save to local storage
      const flow = rfInstance.toObject();

      // Define payload
      const payload = {
        comType: "saveFlow",
        flow,
      }

      // Send payload via WebSocket
      socket.current.send(JSON.stringify(payload));
      console.log('Accepted fault send via WebSocket');

      localStorage.setItem('flow', JSON.stringify(flow));
    }
  }, [socket, rfInstance])

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
              onAnalyze: node.type === 'componentNode' ? onAnalyze : undefined,
              onAccept: node.type === 'componentNode' ? onAccept : undefined
            },
          }))
        );
        setEdges(flow.edges || []);
      }
    };
 
    restoreFlow();   

  }, [setNodes, setEdges, onChange, onAnalyze, onAccept]);


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
          data: {
            label: `node${id}`, 
            onChange: onChange,
            onAnalyze: targetType === 'componentNode' ? onAnalyze : undefined,
            onAccept: targetType === 'componentNode' ? onAccept : undefined
          }
        }

        console.log(newNode);
        
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

  //Load form localStorage on startup
  useEffect(() => {
    onRestore();
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh'}}>      
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          // onNodeClick={onNodeClick}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
        >
          <Panel position='top-right'>
            <button className='panel-button' onClick={onSave}>Save</button>
            <button className='panel-button' onClick={onRestore}>Restore</button>
            <Link to="/fmea-table" className="table-link"></Link>
          </Panel>
        </ReactFlow>
        <Chatbox response={response}/>
    </div>
  );
};

export default Flow;