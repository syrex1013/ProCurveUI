import React, { useEffect, useState } from 'react';
import ConnectionManager from './components/ConnectionManager';
import Dashboard from './pages/Dashboard';
import type {
  SSHProfile, SystemInfo, Vlan, Port, AuditLogEntry,
  CreateVlanCommand, AddPortToVlanCommand, RemovePortFromVlanCommand, ConfigurePortCommand,
} from '@types/ipc';

declare global {
  interface Window {
    ipc: {
      // SSH
      sshConnect: (p: SSHProfile) => Promise<void>;
      sshDisconnect: () => Promise<void>;
      sshIsConnected: () => Promise<boolean>;
      sshExecute: (cmd: string) => Promise<string>;
      // Profiles
      profileList: () => Promise<SSHProfile[]>;
      profileSave: (p: SSHProfile) => Promise<SSHProfile>;
      profileDelete: (id: string) => Promise<void>;
      profileGet: (id: string) => Promise<SSHProfile | null>;
      // Switch queries
      switchGetSystemInfo: () => Promise<SystemInfo>;
      switchGetVlans: () => Promise<Vlan[]>;
      switchGetVlanDetail: (vlanId: number) => Promise<Vlan>;
      switchGetPorts: () => Promise<Port[]>;
      switchGetPortDetails: (portId: string) => Promise<Partial<Port>>;
      switchGetRunningConfig: () => Promise<string>;
      switchGetSpanningTree: () => Promise<string>;
      switchGetLldpNeighbors: () => Promise<string>;
      // VLAN commands
      switchCreateVlan: (data: CreateVlanCommand) => Promise<void>;
      switchDeleteVlan: (vlanId: number) => Promise<void>;
      switchRenameVlan: (data: { vlanId: number; name: string }) => Promise<void>;
      switchAddPortToVlan: (cmd: AddPortToVlanCommand) => Promise<void>;
      switchRemovePortFromVlan: (cmd: RemovePortFromVlanCommand) => Promise<void>;
      // Port commands
      switchConfigurePort: (cmd: ConfigurePortCommand) => Promise<void>;
      // System
      switchSetSystemName: (name: string) => Promise<void>;
      switchSetSystemContact: (contact: string) => Promise<void>;
      switchSaveConfig: () => Promise<string>;
      // Audit
      auditList: (profileId?: string) => Promise<AuditLogEntry[]>;
      auditClear: (profileId?: string) => Promise<void>;
      // Events
      onSshConnected: (cb: (data: any) => void) => void;
      onSshDisconnected: (cb: () => void) => void;
      onSshError: (cb: (err: string) => void) => void;
      removeSshConnectedListener: () => void;
      removeSshDisconnectedListener: () => void;
      removeSshErrorListener: () => void;
    };
  }
}

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<SSHProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.ipc?.sshIsConnected().then(setIsConnected).catch(() => {});

    window.ipc?.onSshConnected(() => { setIsConnected(true); setError(null); });
    window.ipc?.onSshDisconnected(() => { setIsConnected(false); setCurrentProfile(null); });
    window.ipc?.onSshError(setError);

    return () => {
      window.ipc?.removeSshConnectedListener();
      window.ipc?.removeSshDisconnectedListener();
      window.ipc?.removeSshErrorListener();
    };
  }, []);

  const handleDisconnect = async () => {
    await window.ipc?.sshDisconnect();
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#1f2228', userSelect: 'none' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 24px 0 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 52, flexShrink: 0, WebkitAppRegion: 'drag' as any }}>
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '13px', fontWeight: 400, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '2px' }}>
          ProCurve Manager
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, WebkitAppRegion: 'no-drag' as any, minWidth: 0 }}>
          {isConnected && currentProfile && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontFamily: 'Geist Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 1, minWidth: 0 }}>
              {currentProfile.username}@{currentProfile.host}:{currentProfile.port}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isConnected ? '#10b981' : '#6b7280' }} />
            <span style={{ color: isConnected ? '#10b981' : '#6b7280', fontSize: '11px', fontFamily: 'Geist Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {isConnected && (
            <button
              onClick={handleDisconnect}
              style={{
                padding: '4px 12px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'Geist Mono, monospace',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                cursor: 'pointer',
                borderRadius: 0,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding: '8px 24px', backgroundColor: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '14px' }}>✕</button>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {!isConnected ? (
          <ConnectionManager onConnected={p => { setCurrentProfile(p); setIsConnected(true); }} />
        ) : (
          <Dashboard profile={currentProfile} />
        )}
      </div>
    </div>
  );
}
