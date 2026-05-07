// SSH and ProCurve specific types

export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  readyTimeout?: number;
  tryKeyboard?: boolean;
}

export interface SSHCommand {
  cmd: string;
  timeout?: number;
}

export interface SSHResponse {
  stdout: string;
  stderr: string;
  code: number | null;
  error?: Error | null;
}

export interface ProCurveResponse {
  rawOutput: string;
  parsedData?: Record<string, unknown>;
  error?: string;
}

// ProCurve CLI parsing patterns
export const PROCURVE_COMMANDS = {
  SHOW_SYSTEM: 'show system',
  SHOW_VLAN: 'show vlan',
  SHOW_INTERFACES: 'show interfaces brief',
  SHOW_PORT_DETAILS: (port: string) => `show interfaces ${port}`,
  CONFIGURE_VLAN: (vlanId: number) => `vlan ${vlanId}`,
  DELETE_VLAN: (vlanId: number) => `no vlan ${vlanId}`,
  TAG_PORT: (ports: string) => `tagged ${ports}`,
  UNTAG_PORT: (ports: string) => `untagged ${ports}`,
  SET_PORT_SPEED: (port: string, speed: string) => `interface ${port}\nspeed ${speed}`,
  SET_PORT_DUPLEX: (port: string, duplex: string) => `interface ${port}\nduplex ${duplex}`,
  ENABLE_PORT: (port: string) => `interface ${port}\nno shutdown`,
  DISABLE_PORT: (port: string) => `interface ${port}\nshutdown`,
  SET_DESCRIPTION: (port: string, desc: string) => `interface ${port}\ndescription ${desc}`,
  SET_SYSTEM_NAME: (name: string) => `system-name "${name}"`,
  SET_SYSTEM_CONTACT: (contact: string) => `system contact "${contact}"`,
  EXIT_VLAN: 'exit',
  COPY_RUNNING_STARTUP: 'write memory',
} as const;
