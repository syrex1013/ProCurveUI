import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';
import SSHClient from './ssh/client.js';
import ProCurveParser from './ssh/parser.js';
import DatabaseManager from './database/db.js';
import type {
  SSHProfile, SystemInfo, Vlan, Port, AuditLogEntry,
  CreateVlanCommand, ModifyVlanCommand, AddPortToVlanCommand,
  RemovePortFromVlanCommand, ConfigurePortCommand,
} from '../types/ipc.js';
import type { SSHConnectionConfig } from '../types/ssh.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let sshClient: SSHClient | null = null;
let db: DatabaseManager | null = null;
let currentProfile: SSHProfile | null = null;

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  const indexPath = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  const iconPath = isDev 
    ? path.join(__dirname, '../../assets/icon.png')
    : path.join(__dirname, '../assets/icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hidden' : 'default',
    frame: process.platform === 'darwin' ? false : true,
    backgroundColor: '#1f2228',
    icon: iconPath,
  });

  mainWindow.loadURL(indexPath);

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.on('ready', () => {
  db = new DatabaseManager();
  db.initialize();
  sshClient = new SSHClient();
  createWindow();
  createMenu();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('quit', cleanup);

// ── SSH Connection ─────────────────────────────────────────────────────────────

ipcMain.handle('ssh:connect', async (_event, profile: SSHProfile) => {
  if (!sshClient || !db) throw new Error('Initialization failed');

  let password = profile.password;
  if (!password && profile.savePassword) {
    password = db.getDecryptedPassword(profile.id) ?? undefined;
    if (!password) throw new Error('Saved password not found');
  }
  if (!password) throw new Error('Password required');

  const config: SSHConnectionConfig = {
    host: profile.host,
    port: profile.port,
    username: profile.username,
    password,
  };

  await sshClient.connect(config);
  currentProfile = profile;
  mainWindow?.webContents.send('ssh:connected', { profileId: profile.id });
  db.addAuditEntry(profile.id, `Connected to ${profile.host}`, 'Success', true);
  return { success: true };
});

ipcMain.handle('ssh:disconnect', async () => {
  if (!sshClient) return;
  await sshClient.disconnect().catch(console.error);
  if (currentProfile) db?.addAuditEntry(currentProfile.id, 'Disconnected', 'Success', true);
  currentProfile = null;
  mainWindow?.webContents.send('ssh:disconnected');
});

ipcMain.handle('ssh:isConnected', () => sshClient?.getConnectionStatus() ?? false);

ipcMain.handle('ssh:execute', async (_event, command: string) => {
  if (!sshClient) throw new Error('SSH client not initialized');
  const result = await sshClient.execute(command);
  if (currentProfile) db?.addAuditEntry(currentProfile.id, command, result.substring(0, 500), true);
  return result;
});

// ── Profile Management ─────────────────────────────────────────────────────────

ipcMain.handle('profile:list', () => {
  if (!db) throw new Error('Database not initialized');
  return db.listProfiles();
});

ipcMain.handle('profile:save', (_event, profile: SSHProfile) => {
  if (!db) throw new Error('Database not initialized');
  return db.saveProfile(profile);
});

ipcMain.handle('profile:delete', (_event, profileId: string) => {
  if (!db) throw new Error('Database not initialized');
  db.deleteProfile(profileId);
});

ipcMain.handle('profile:get', (_event, profileId: string) => {
  if (!db) throw new Error('Database not initialized');
  return db.getProfile(profileId);
});

// ── Switch Queries ─────────────────────────────────────────────────────────────

ipcMain.handle('switch:getSystemInfo', async () => {
  if (!sshClient) throw new Error('SSH not connected');
  const output = await sshClient.execute('show system');
  const info = ProCurveParser.parseSystemInfo(output);
  if (currentProfile) db?.addAuditEntry(currentProfile.id, 'show system', JSON.stringify(info), true);
  return info;
});

ipcMain.handle('switch:getVlans', async () => {
  if (!sshClient) throw new Error('SSH not connected');
  const output = await sshClient.execute('show vlan');
  const vlans = ProCurveParser.parseVlans(output);
  if (currentProfile) db?.addAuditEntry(currentProfile.id, 'show vlan', `${vlans.length} VLANs`, true);
  return vlans;
});

ipcMain.handle('switch:getVlanDetail', async (_event, vlanId: number) => {
  if (!sshClient) throw new Error('SSH not connected');
  const output = await sshClient.execute(`show vlan ${vlanId}`);
  return ProCurveParser.parseVlanDetail(output, vlanId);
});

ipcMain.handle('switch:getPorts', async () => {
  if (!sshClient) throw new Error('SSH not connected');
  const output = await sshClient.execute('show interfaces brief');
  const ports = ProCurveParser.parsePorts(output);
  if (currentProfile) db?.addAuditEntry(currentProfile.id, 'show interfaces brief', `${ports.length} ports`, true);
  return ports;
});

ipcMain.handle('switch:getPortDetails', async (_event, portId: string) => {
  if (!sshClient) throw new Error('SSH not connected');
  const output = await sshClient.execute(`show interfaces ${portId}`);
  return ProCurveParser.parsePortDetails(output, portId);
});

ipcMain.handle('switch:getRunningConfig', async () => {
  if (!sshClient) throw new Error('SSH not connected');
  return sshClient.execute('show running-config');
});

ipcMain.handle('switch:getSpanningTree', async () => {
  if (!sshClient) throw new Error('SSH not connected');
  return sshClient.execute('show spanning-tree');
});

ipcMain.handle('switch:getLldpNeighbors', async () => {
  if (!sshClient) throw new Error('SSH not connected');
  return sshClient.execute('show lldp info remote-device');
});

// ── VLAN Commands ─────────────────────────────────────────────────────────────

ipcMain.handle('switch:createVlan', async (_event, data: CreateVlanCommand) => {
  if (!sshClient) throw new Error('SSH not connected');
  const result = await sshClient.executeInteractive([
    `vlan ${data.vlanId}`,
    `name "${data.name}"`,
    'exit',
  ]);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Create VLAN ${data.vlanId} "${data.name}"`, result, true);
});

ipcMain.handle('switch:deleteVlan', async (_event, vlanId: number) => {
  if (!sshClient) throw new Error('SSH not connected');
  const result = await sshClient.executeInteractive([`no vlan ${vlanId}`]);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Delete VLAN ${vlanId}`, result, true);
});

ipcMain.handle('switch:renameVlan', async (_event, { vlanId, name }: { vlanId: number; name: string }) => {
  if (!sshClient) throw new Error('SSH not connected');
  const result = await sshClient.executeInteractive([
    `vlan ${vlanId}`,
    `name "${name}"`,
    'exit',
  ]);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Rename VLAN ${vlanId} to "${name}"`, result, true);
});

ipcMain.handle('switch:addPortToVlan', async (_event, cmd: AddPortToVlanCommand) => {
  if (!sshClient) throw new Error('SSH not connected');
  const portList = cmd.ports.join(',');
  const tagCmd = cmd.tagged ? `tagged ${portList}` : `untagged ${portList}`;
  const result = await sshClient.executeInteractive([`vlan ${cmd.vlanId}`, tagCmd, 'exit']);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Add port ${portList} to VLAN ${cmd.vlanId} (${cmd.tagged ? 'tagged' : 'untagged'})`, result, true);
});

ipcMain.handle('switch:removePortFromVlan', async (_event, cmd: RemovePortFromVlanCommand) => {
  if (!sshClient) throw new Error('SSH not connected');
  const portList = cmd.ports.join(',');
  const result = await sshClient.executeInteractive([
    `vlan ${cmd.vlanId}`,
    `no tagged ${portList}`,
    `no untagged ${portList}`,
    'exit',
  ]);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Remove port ${portList} from VLAN ${cmd.vlanId}`, result, true);
});

// ── Port Commands ─────────────────────────────────────────────────────────────

ipcMain.handle('switch:configurePort', async (_event, cmd: ConfigurePortCommand) => {
  if (!sshClient) throw new Error('SSH not connected');
  const cmds: string[] = [`interface ${cmd.portId}`];

  if (cmd.enabled === true) cmds.push('enable');
  else if (cmd.enabled === false) cmds.push('disable');

  if (cmd.description !== undefined)
    cmds.push(`name "${cmd.description}"`);

  if (cmd.speed !== undefined || cmd.duplex !== undefined) {
    const speed = cmd.speed || 'auto';
    const duplex = cmd.duplex || 'auto';
    if (speed === 'auto' || duplex === 'auto') {
      cmds.push('speed-duplex auto');
    } else {
      cmds.push(`speed-duplex ${speed}-${duplex}`);
    }
  }

  if (cmd.flowControl !== undefined)
    cmds.push(cmd.flowControl ? 'flow-control' : 'no flow-control');

  cmds.push('exit');

  const result = await sshClient.executeInteractive(cmds);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Configure port ${cmd.portId}`, result, true);
});

// ── System Commands ────────────────────────────────────────────────────────────

ipcMain.handle('switch:setSystemName', async (_event, name: string) => {
  if (!sshClient) throw new Error('SSH not connected');
  const result = await sshClient.executeInteractive([`hostname "${name}"`]);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Set hostname to "${name}"`, result, true);
});

ipcMain.handle('switch:setSystemContact', async (_event, contact: string) => {
  if (!sshClient) throw new Error('SSH not connected');
  const result = await sshClient.executeInteractive([`snmp-server contact "${contact}"`]);
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, `Set system contact to "${contact}"`, result, true);
});

ipcMain.handle('switch:saveConfig', async () => {
  if (!sshClient) throw new Error('SSH not connected');
  const result = await sshClient.execute('write memory');
  if (currentProfile)
    db?.addAuditEntry(currentProfile.id, 'write memory', result, true);
  return result;
});

// ── Audit Log ─────────────────────────────────────────────────────────────────

ipcMain.handle('audit:list', (_event, profileId?: string) => {
  if (!db) throw new Error('Database not initialized');
  return db.getAuditLog(profileId);
});

ipcMain.handle('audit:clear', (_event, profileId?: string) => {
  if (!db) throw new Error('Database not initialized');
  db.clearAuditLog(profileId);
});

// ── Menu ──────────────────────────────────────────────────────────────────────

function createMenu() {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Toggle DevTools', accelerator: 'Alt+CmdOrCtrl+I', role: 'toggleDevTools' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── Cleanup ───────────────────────────────────────────────────────────────────

function cleanup() {
  if (sshClient) sshClient.disconnect().catch(console.error);
  if (db) db.close();
}
