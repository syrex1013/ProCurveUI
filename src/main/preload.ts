import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ipc', {
  // SSH
  sshConnect: (profile: any) => ipcRenderer.invoke('ssh:connect', profile),
  sshDisconnect: () => ipcRenderer.invoke('ssh:disconnect'),
  sshIsConnected: () => ipcRenderer.invoke('ssh:isConnected'),
  sshExecute: (cmd: string) => ipcRenderer.invoke('ssh:execute', cmd),

  // Profiles
  profileList: () => ipcRenderer.invoke('profile:list'),
  profileSave: (p: any) => ipcRenderer.invoke('profile:save', p),
  profileDelete: (id: string) => ipcRenderer.invoke('profile:delete', id),
  profileGet: (id: string) => ipcRenderer.invoke('profile:get', id),

  // Switch queries
  switchGetSystemInfo: () => ipcRenderer.invoke('switch:getSystemInfo'),
  switchGetVlans: () => ipcRenderer.invoke('switch:getVlans'),
  switchGetVlanDetail: (vlanId: number) => ipcRenderer.invoke('switch:getVlanDetail', vlanId),
  switchGetPorts: () => ipcRenderer.invoke('switch:getPorts'),
  switchGetPortDetails: (portId: string) => ipcRenderer.invoke('switch:getPortDetails', portId),
  switchGetRunningConfig: () => ipcRenderer.invoke('switch:getRunningConfig'),
  switchGetSpanningTree: () => ipcRenderer.invoke('switch:getSpanningTree'),
  switchGetLldpNeighbors: () => ipcRenderer.invoke('switch:getLldpNeighbors'),

  // VLAN commands
  switchCreateVlan: (data: any) => ipcRenderer.invoke('switch:createVlan', data),
  switchDeleteVlan: (vlanId: number) => ipcRenderer.invoke('switch:deleteVlan', vlanId),
  switchRenameVlan: (data: any) => ipcRenderer.invoke('switch:renameVlan', data),
  switchAddPortToVlan: (cmd: any) => ipcRenderer.invoke('switch:addPortToVlan', cmd),
  switchRemovePortFromVlan: (cmd: any) => ipcRenderer.invoke('switch:removePortFromVlan', cmd),

  // Port commands
  switchConfigurePort: (cmd: any) => ipcRenderer.invoke('switch:configurePort', cmd),

  // System commands
  switchSetSystemName: (name: string) => ipcRenderer.invoke('switch:setSystemName', name),
  switchSetSystemContact: (contact: string) => ipcRenderer.invoke('switch:setSystemContact', contact),
  switchSaveConfig: () => ipcRenderer.invoke('switch:saveConfig'),

  // Audit
  auditList: (profileId?: string) => ipcRenderer.invoke('audit:list', profileId),
  auditClear: (profileId?: string) => ipcRenderer.invoke('audit:clear', profileId),

  // Events
  onSshConnected: (cb: (data: any) => void) =>
    ipcRenderer.on('ssh:connected', (_e, data) => cb(data)),
  onSshDisconnected: (cb: () => void) =>
    ipcRenderer.on('ssh:disconnected', () => cb()),
  onSshError: (cb: (err: string) => void) =>
    ipcRenderer.on('ssh:error', (_e, err) => cb(err)),
  removeSshConnectedListener: () => ipcRenderer.removeAllListeners('ssh:connected'),
  removeSshDisconnectedListener: () => ipcRenderer.removeAllListeners('ssh:disconnected'),
  removeSshErrorListener: () => ipcRenderer.removeAllListeners('ssh:error'),

  platform: process.platform,
});
