'use client';

import { useState } from 'react';

interface RefreshButtonProps {
  onRefresh: () => void;
  color?: string;
}

export default function RefreshButton({ onRefresh, color = '#1565C0' }: RefreshButtonProps) {
  const [spinning, setSpinning] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    setSpinning(true);
    onRefresh();
    setLastUpdate(new Date());
    setTimeout(() => setSpinning(false), 1000);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
        Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </span>
      <button
        onClick={handleRefresh}
        style={{
          background: 'white',
          border: `1px solid ${color}20`,
          borderRadius: '10px',
          padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: '6px',
          cursor: 'pointer', fontSize: '12px',
          color: color, fontWeight: '600',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      >
        <span style={{
          display: 'inline-block',
          animation: spinning ? 'spin 1s linear infinite' : 'none',
          fontSize: '14px'
        }}>
          🔄
        </span>
        Actualiser
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </button>
    </div>
  );
}