import { Handle, Position } from 'reactflow';

export default function TournamentNode({ data }: any) {
  return (
    <div style={{
      padding: 16,
      border: '1px solid #bbb',
      borderRadius: 8,
      background: '#fff',
      minWidth: 120,
      textAlign: 'center',
      position: 'relative'
    }}>
      {data.target && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: '#555',
            opacity: data.hideTarget ? 0 : 1,
            pointerEvents: data.hideTarget ? 'none' : 'auto',
          }}
        />
      )}
      <div>{data.label}</div>
      {data.source && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: '#555',
            opacity: data.hideSource ? 0 : 1,
            pointerEvents: data.hideSource ? 'none' : 'auto',
          }}
        />
      )}
    </div>
  );
} 