import React, { useState, useEffect } from 'react';
import type { AuditLogEntry } from '@types/ipc';

export default function AuditTab() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [onlyErrors, setOnlyErrors] = useState(false);

  useEffect(() => { loadLog(); }, []);

  const loadLog = async () => {
    setLoading(true);
    try {
      const log = await window.ipc.auditList();
      setEntries(log);
    } catch {}
    finally { setLoading(false); }
  };

  const clearLog = async () => {
    if (!confirm('Clear audit log?')) return;
    await window.ipc.auditClear();
    setEntries([]);
  };

  const filtered = entries.filter(e => {
    if (onlyErrors && e.success) return false;
    if (!filter) return true;
    return e.command.toLowerCase().includes(filter.toLowerCase()) ||
      e.result.toLowerCase().includes(filter.toLowerCase());
  });

  const fmt = (d: Date | string) => {
    const dt = typeof d === 'string' ? new Date(d) : d;
    return dt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter by command or result…"
          style={{
            flex: 1,
            minWidth: 200,
            padding: '7px 12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff',
            fontSize: '12px',
            borderRadius: 0,
            outline: 'none',
            fontFamily: 'Geist Mono, monospace',
          }}
        />
        <button
          onClick={() => setOnlyErrors(!onlyErrors)}
          style={{
            padding: '6px 14px',
            backgroundColor: onlyErrors ? 'rgba(239,68,68,0.15)' : 'transparent',
            border: `1px solid ${onlyErrors ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)'}`,
            color: onlyErrors ? '#fca5a5' : 'rgba(255,255,255,0.6)',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 0,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Errors only
        </button>
        <button
          onClick={loadLog}
          style={{
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 0,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Refresh
        </button>
        <button
          onClick={clearLog}
          style={{
            padding: '6px 14px',
            backgroundColor: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 0,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Clear Log
        </button>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'Geist Mono, monospace' }}>
          {filtered.length} entries
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center' }}>No entries</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '160px 50px 1fr 1fr', padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 0, backgroundColor: '#1f2228', zIndex: 1 }}>
              {['Timestamp', 'OK', 'Command', 'Result'].map(h => (
                <span key={h} style={{ fontFamily: 'Geist Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
              ))}
            </div>
            {filtered.map(entry => (
              <div
                key={entry.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '160px 50px 1fr 1fr',
                  padding: '8px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  alignItems: 'start',
                  backgroundColor: entry.success ? 'transparent' : 'rgba(239,68,68,0.04)',
                }}
              >
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                  {fmt(entry.timestamp)}
                </span>
                <span style={{ fontSize: '12px', textAlign: 'center' }}>
                  {entry.success ? '✓' : '✗'}
                </span>
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '12px', color: '#60a5fa', paddingRight: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.command}
                </span>
                <span style={{ fontSize: '11px', color: entry.success ? 'rgba(255,255,255,0.5)' : '#fca5a5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.result}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
