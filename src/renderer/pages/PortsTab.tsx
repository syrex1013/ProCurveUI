import React, { useState } from 'react';
import type { Port } from '@types/ipc';

const S = {
  btn: (variant: 'primary' | 'ghost' | 'danger' = 'ghost', disabled = false): React.CSSProperties => ({
    padding: '6px 14px',
    backgroundColor: variant === 'primary' ? '#ffffff' : variant === 'danger' ? 'rgba(239,68,68,0.1)' : 'transparent',
    color: variant === 'primary' ? '#1f2228' : variant === 'danger' ? '#fca5a5' : '#ffffff',
    border: `1px solid ${variant === 'primary' ? '#ffffff' : variant === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.2)'}`,
    fontFamily: 'Geist Mono, monospace',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    borderRadius: 0,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  input: (): React.CSSProperties => ({
    width: '100%',
    padding: '8px 10px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontSize: '13px',
    borderRadius: 0,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }),
  label: (): React.CSSProperties => ({
    display: 'block',
    marginBottom: '6px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    fontFamily: 'Geist Mono, monospace',
  }),
};

function portColor(port: Port): string {
  if (!port.enabled) return 'rgba(255,255,255,0.1)';
  if (port.status === 'up') return '#10b981';
  return '#ef4444';
}

interface Props {
  ports: Port[];
  onRefresh: () => void;
}

export default function PortsTab({ ports, onRefresh }: Props) {
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  const [detailPort, setDetailPort] = useState<Partial<Port> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit form state
  const [editDesc, setEditDesc] = useState('');
  const [editSpeed, setEditSpeed] = useState('auto');
  const [editDuplex, setEditDuplex] = useState('auto');
  const [editEnabled, setEditEnabled] = useState(true);
  const [editFlowCtrl, setEditFlowCtrl] = useState(false);

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  };

  const loadPortDetail = async (port: Port) => {
    setSelectedPort(port);
    setEditDesc(port.description || '');
    setEditSpeed(port.speed || 'auto');
    setEditDuplex(port.duplex || 'auto');
    setEditEnabled(port.enabled);
    setDetailPort(null);
    try {
      const d = await window.ipc.switchGetPortDetails(port.id);
      setDetailPort(d);
      setEditDesc(d.description || '');
      setEditSpeed(d.speed || 'auto');
      setEditDuplex(d.duplex || 'auto');
      setEditEnabled(d.enabled ?? port.enabled);
      setEditFlowCtrl(d.flowControl ?? false);
    } catch {
      setDetailPort(port);
    }
  };

  const handleSave = async () => {
    if (!selectedPort) return;
    setLoading(true);
    try {
      await window.ipc.switchConfigurePort({
        portId: selectedPort.id,
        enabled: editEnabled,
        description: editDesc,
        speed: editSpeed === 'auto' ? undefined : editSpeed,
        duplex: editDuplex === 'auto' ? 'auto' : editDuplex as any,
        flowControl: editFlowCtrl,
      });
      flash(`Port ${selectedPort.id} saved`);
      onRefresh();
    } catch (e: any) {
      flash(String(e), true);
    } finally { setLoading(false); }
  };

  const handleToggle = async (port: Port) => {
    setLoading(true);
    try {
      await window.ipc.switchConfigurePort({ portId: port.id, enabled: !port.enabled });
      flash(`Port ${port.id} ${port.enabled ? 'disabled' : 'enabled'}`);
      onRefresh();
    } catch (e: any) {
      flash(String(e), true);
    } finally { setLoading(false); }
  };

  const upPorts = ports.filter(p => p.status === 'up' && p.enabled).length;
  const downPorts = ports.filter(p => p.status === 'down' && p.enabled).length;
  const disabledPorts = ports.filter(p => !p.enabled).length;

  // Build port map for grid — fill gaps up to 50
  const portMap = new Map(ports.map(p => [p.index, p]));
  const totalPorts = Math.max(ports.length, 48);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left: visual grid + list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        {error && <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px' }}>{error}</div>}
        {success && <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '12px' }}>{success}</div>}

        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
            {ports.length} Ports
          </span>
          {[
            { color: '#10b981', label: `Up (${upPorts})` },
            { color: '#ef4444', label: `Down (${downPorts})` },
            { color: 'rgba(255,255,255,0.15)', label: `Disabled (${disabledPorts})` },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, backgroundColor: color, border: '1px solid rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Switch chassis visual */}
        <div style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, marginBottom: 8 }}>
            {Array.from({ length: totalPorts }, (_, i) => i + 1).map(idx => {
              const port = portMap.get(idx);
              if (!port) {
                return (
                  <div key={idx} style={{ aspectRatio: '1', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', fontFamily: 'Geist Mono, monospace' }}>{idx}</span>
                  </div>
                );
              }
              const color = portColor(port);
              const isSelected = selectedPort?.id === port.id;
              return (
                <div
                  key={idx}
                  title={`Port ${port.id}${port.description ? ` - ${port.description}` : ''}\n${port.enabled ? (port.status === 'up' ? `Up ${port.speed}Mbps ${port.duplex}` : 'Down') : 'Disabled'}`}
                  onClick={() => loadPortDetail(port)}
                  style={{
                    aspectRatio: '1',
                    backgroundColor: `${color}22`,
                    border: `2px solid ${isSelected ? '#ffffff' : color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <span style={{ fontSize: '8px', color: isSelected ? '#ffffff' : color, fontFamily: 'Geist Mono, monospace', fontWeight: isSelected ? 700 : 400 }}>{idx}</span>
                  {port.status === 'up' && port.enabled && (
                    <div style={{ position: 'absolute', top: 2, right: 2, width: 4, height: 4, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Geist Mono, monospace', textAlign: 'center', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            HP PROCURVE 2510G-48
          </div>
        </div>

        {/* Port table */}
        <div style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 80px 1fr 90px 80px 80px 80px', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px' }}>
            {['Port', 'Type', 'Description', 'Status', 'Speed', 'Duplex', 'Action'].map(h => (
              <span key={h} style={{ fontFamily: 'Geist Mono, monospace', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</span>
            ))}
          </div>
          {ports.map(port => {
            const color = portColor(port);
            const isSelected = selectedPort?.id === port.id;
            return (
              <div
                key={port.id}
                onClick={() => loadPortDetail(port)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 80px 1fr 90px 80px 80px 80px',
                  gap: 0,
                  padding: '7px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.06)' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '12px', color: '#ffffff' }}>{port.id}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{port.type || '—'}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{port.description || '—'}</span>
                <span style={{ fontSize: '11px', color }}>
                  {!port.enabled ? 'Disabled' : port.status === 'up' ? '● Up' : '○ Down'}
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{port.speed || '—'}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{port.duplex || '—'}</span>
                <button
                  style={{ ...S.btn(port.enabled ? 'danger' : 'ghost'), padding: '2px 8px', fontSize: '10px' }}
                  onClick={e => { e.stopPropagation(); handleToggle(port); }}
                  disabled={loading}
                >
                  {port.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: port detail/config panel */}
      {selectedPort && (
        <div style={{ width: 300, overflow: 'auto', padding: '24px', flexShrink: 0 }}>
          <h3 style={{ fontFamily: 'Geist Mono, monospace', fontSize: '16px', fontWeight: 300, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 0, marginBottom: 8 }}>
            Port {selectedPort.id}
          </h3>
          {selectedPort.type && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: 20 }}>{selectedPort.type}</div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={S.label()}>Description</label>
            <input value={editDesc} onChange={e => setEditDesc(e.target.value)} style={S.input()} placeholder="e.g. Uplink to Core" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label()}>Speed</label>
            <select value={editSpeed} onChange={e => setEditSpeed(e.target.value)} style={{ ...S.input(), appearance: 'none' as any }}>
              <option value="auto">Auto</option>
              <option value="10">10 Mbps</option>
              <option value="100">100 Mbps</option>
              <option value="1000">1000 Mbps</option>
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={S.label()}>Duplex</label>
            <select value={editDuplex} onChange={e => setEditDuplex(e.target.value)} style={{ ...S.input(), appearance: 'none' as any }}>
              <option value="auto">Auto</option>
              <option value="full">Full</option>
              <option value="half">Half</option>
            </select>
          </div>

          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label style={{ ...S.label(), marginBottom: 0 }}>Port Enabled</label>
            </div>
            <button
              style={S.btn(editEnabled ? 'primary' : 'ghost')}
              onClick={() => setEditEnabled(!editEnabled)}
            >
              {editEnabled ? 'On' : 'Off'}
            </button>
          </div>

          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ ...S.label(), marginBottom: 0 }}>Flow Control</label>
            <button
              style={S.btn(editFlowCtrl ? 'primary' : 'ghost')}
              onClick={() => setEditFlowCtrl(!editFlowCtrl)}
            >
              {editFlowCtrl ? 'On' : 'Off'}
            </button>
          </div>

          <button style={S.btn('primary', loading)} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Apply'}
          </button>

          {/* Current VLAN info */}
          {(detailPort || selectedPort) && (
            <div style={{ marginTop: 24, padding: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', marginBottom: 8 }}>VLAN Membership</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                Untagged: <span style={{ color: '#ffffff' }}>{(detailPort as Port)?.vlans?.untagged ?? selectedPort.vlans?.untagged ?? '—'}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                Tagged: <span style={{ color: '#ffffff' }}>{((detailPort as Port)?.vlans?.tagged ?? selectedPort.vlans?.tagged ?? []).join(', ') || '—'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
