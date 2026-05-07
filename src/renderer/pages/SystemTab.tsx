import React, { useState } from 'react';
import type { SystemInfo } from '@types/ipc';

const S = {
  btn: (variant: 'primary' | 'ghost' | 'danger' = 'ghost', disabled = false): React.CSSProperties => ({
    padding: '8px 18px',
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
    padding: '9px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontSize: '13px',
    borderRadius: 0,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  }),
  label: (): React.CSSProperties => ({
    display: 'block',
    marginBottom: '6px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    fontFamily: 'Geist Mono, monospace',
  }),
  row: (): React.CSSProperties => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  }),
  key: (): React.CSSProperties => ({
    color: 'rgba(255,255,255,0.4)',
    fontSize: '12px',
    fontFamily: 'Geist Mono, monospace',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    flex: '0 0 180px',
  }),
  val: (): React.CSSProperties => ({
    color: '#ffffff',
    fontSize: '13px',
    textAlign: 'right' as const,
    flex: 1,
  }),
};

interface Props {
  systemInfo: SystemInfo | null;
  onRefresh: () => void;
}

export default function SystemTab({ systemInfo, onRefresh }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editName, setEditName] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [editingContact, setEditingContact] = useState(false);

  const [runningConfig, setRunningConfig] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(false);

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setTimeout(() => setError(null), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      await window.ipc.switchSaveConfig();
      flash('Configuration saved to startup (write memory)');
    } catch (e: any) { flash(String(e), true); }
    finally { setLoading(false); }
  };

  const setSystemName = async () => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await window.ipc.switchSetSystemName(editName.trim());
      setEditingName(false);
      flash('System name updated');
      onRefresh();
    } catch (e: any) { flash(String(e), true); }
    finally { setLoading(false); }
  };

  const setContact = async () => {
    setLoading(true);
    try {
      await window.ipc.switchSetSystemContact(editContact.trim());
      setEditingContact(false);
      flash('System contact updated');
      onRefresh();
    } catch (e: any) { flash(String(e), true); }
    finally { setLoading(false); }
  };

  const loadRunningConfig = async () => {
    setConfigLoading(true);
    try {
      const cfg = await window.ipc.switchGetRunningConfig();
      setRunningConfig(cfg);
    } catch (e: any) { flash(String(e), true); }
    finally { setConfigLoading(false); }
  };

  const memPct = systemInfo?.memoryUsagePercent ?? 0;
  const memColor = memPct > 80 ? '#ef4444' : memPct > 60 ? '#f59e0b' : '#10b981';

  return (
    <div style={{ overflow: 'auto', padding: '32px', maxWidth: 800 }}>
      {error && <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px' }}>{error}</div>}
      {success && <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '12px' }}>{success}</div>}

      {!systemInfo ? (
        <div style={{ color: 'rgba(255,255,255,0.3)' }}>Loading system info…</div>
      ) : (
        <>
          {/* Hardware info */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'Geist Mono, monospace', fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16, marginTop: 0 }}>Hardware</h3>
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '0 16px' }}>
              {[
                ['Model', systemInfo.model],
                ['Serial Number', systemInfo.serialNumber],
                ['MAC Address', systemInfo.macAddress || '—'],
                ['Firmware', systemInfo.firmwareVersion],
                ['ROM Version', systemInfo.romVersion || '—'],
                ['Uptime', systemInfo.systemUptime],
              ].map(([k, v]) => (
                <div key={k} style={S.row()}>
                  <span style={S.key()}>{k}</span>
                  <span style={S.val()}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'Geist Mono, monospace', fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16, marginTop: 0 }}>Resources</h3>
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '16px' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase' }}>Memory</span>
                  <span style={{ color: memColor, fontSize: '12px', fontFamily: 'Geist Mono, monospace' }}>{memPct}%</span>
                </div>
                <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 0 }}>
                  <div style={{ height: '100%', width: `${memPct}%`, backgroundColor: memColor, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{(systemInfo.usedMemory / 1024).toFixed(0)} KB used</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>{(systemInfo.totalMemory / 1024).toFixed(0)} KB total</span>
                </div>
              </div>
              {systemInfo.cpuUsagePercent !== undefined && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase' }}>CPU</span>
                    <span style={{ color: '#ffffff', fontSize: '12px', fontFamily: 'Geist Mono, monospace' }}>{systemInfo.cpuUsagePercent}%</span>
                  </div>
                  <div style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div style={{ height: '100%', width: `${systemInfo.cpuUsagePercent}%`, backgroundColor: '#3b82f6' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editable settings */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'Geist Mono, monospace', fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16, marginTop: 0 }}>Settings</h3>
            <div style={{ border: '1px solid rgba(255,255,255,0.1)', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* System Name */}
              <div>
                <label style={S.label()}>System Name</label>
                {editingName ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={editName} onChange={e => setEditName(e.target.value)} style={S.input()} onKeyDown={e => e.key === 'Enter' && setSystemName()} autoFocus />
                    <button style={S.btn('primary', loading)} onClick={setSystemName} disabled={loading}>Save</button>
                    <button style={S.btn()} onClick={() => setEditingName(false)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#ffffff', fontSize: '14px' }}>{systemInfo.systemName}</span>
                    <button style={S.btn()} onClick={() => { setEditName(systemInfo.systemName); setEditingName(true); }}>Edit</button>
                  </div>
                )}
              </div>

              {/* System Contact */}
              <div>
                <label style={S.label()}>System Contact</label>
                {editingContact ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={editContact} onChange={e => setEditContact(e.target.value)} style={S.input()} onKeyDown={e => e.key === 'Enter' && setContact()} autoFocus />
                    <button style={S.btn('primary', loading)} onClick={setContact} disabled={loading}>Save</button>
                    <button style={S.btn()} onClick={() => setEditingContact(false)}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#ffffff', fontSize: '14px' }}>{systemInfo.systemContact || '—'}</span>
                    <button style={S.btn()} onClick={() => { setEditContact(systemInfo.systemContact || ''); setEditingContact(true); }}>Edit</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Config actions */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontFamily: 'Geist Mono, monospace', fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: 16, marginTop: 0 }}>Configuration</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <button style={S.btn('primary', loading)} onClick={saveConfig} disabled={loading}>
                {loading ? 'Saving…' : 'Write Memory (Save)'}
              </button>
              <button style={S.btn('ghost', configLoading)} onClick={loadRunningConfig} disabled={configLoading}>
                {configLoading ? 'Loading…' : 'Show Running Config'}
              </button>
            </div>
            {runningConfig && (
              <div style={{ padding: '16px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#10b981', fontSize: '11px', fontFamily: 'Geist Mono, monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {runningConfig}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
