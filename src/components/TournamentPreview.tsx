'use client';

import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import TournamentNode from './TournamentNode';

const nodeTypes = {
  tournament: TournamentNode,
};

// サンプルデータ
const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Player 1', source: true }, type: 'tournament' },
  { id: '2', position: { x: 0, y: 100 }, data: { label: 'Player 2', source: true }, type: 'tournament' },
  { id: '3', position: { x: 0, y: 200 }, data: { label: 'Player 3', source: true }, type: 'tournament' },
  { id: '4', position: { x: 0, y: 300 }, data: { label: 'Player 4', source: true }, type: 'tournament' },
  { id: '5', position: { x: 200, y: 50 }, data: { label: 'Match 1', source: true, target: true }, type: 'tournament' },
  { id: '6', position: { x: 200, y: 250 }, data: { label: 'Match 2', source: true, target: true }, type: 'tournament' },
  { id: '7', position: { x: 400, y: 150 }, data: { label: 'Final', target: true, source: true, hideSource: true }, type: 'tournament' },
];

const initialEdges: Edge[] = [
  { id: 'e1-5', source: '1', target: '5' },
  { id: 'e2-5', source: '2', target: '5' },
  { id: 'e3-6', source: '3', target: '6' },
  { id: 'e4-6', source: '4', target: '6' },
  { id: 'e5-7', source: '5', target: '7' },
  { id: 'e6-7', source: '6', target: '7' },
];

export default function TournamentPreview() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
} 