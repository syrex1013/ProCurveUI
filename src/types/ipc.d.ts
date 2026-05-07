export interface IPC_Channel {
    'ssh:connect': (profile: SSHProfile) => Promise<void>;
    'ssh:disconnect': () => Promise<void>;
    'ssh:isConnected': () => Promise<boolean>;
    'ssh:execute': (command: string) => Promise<string>;
    'profile:list': () => Promise<SSHProfile[]>;
    'profile:save': (profile: SSHProfile) => Promise<SSHProfile>;
    'profile:delete': (profileId: string) => Promise<void>;
    'profile:get': (profileId: string) => Promise<SSHProfile | null>;
    'switch:getSystemInfo': () => Promise<SystemInfo>;
    'switch:getVlans': () => Promise<Vlan[]>;
    'switch:getPorts': () => Promise<Port[]>;
    'switch:getPortDetails': (portId: string) => Promise<Port>;
    'switch:createVlan': (vlan: CreateVlanCommand) => Promise<void>;
    'switch:deleteVlan': (vlanId: number) => Promise<void>;
    'switch:modifyVlan': (vlan: ModifyVlanCommand) => Promise<void>;
    'switch:addPortToVlan': (cmd: AddPortToVlanCommand) => Promise<void>;
    'switch:removePortFromVlan': (cmd: RemovePortFromVlanCommand) => Promise<void>;
    'switch:configurePort': (cmd: ConfigurePortCommand) => Promise<void>;
    'switch:setSystemName': (name: string) => Promise<void>;
    'switch:setSystemContact': (contact: string) => Promise<void>;
    'audit:list': () => Promise<AuditLogEntry[]>;
    'audit:clear': () => Promise<void>;
    'ssh:connected': () => void;
    'ssh:disconnected': () => void;
    'ssh:error': (error: string) => void;
}
export interface SSHProfile {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    password?: string;
    passwordEncrypted?: string;
    savePassword?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface SystemInfo {
    model: string;
    firmwareVersion: string;
    serialNumber: string;
    systemUptime: string;
    systemName: string;
    systemContact: string;
    totalMemory: number;
    usedMemory: number;
    memoryUsagePercent: number;
    ports: {
        total: number;
        active: number;
        inactive: number;
    };
}
export interface Vlan {
    id: number;
    name: string;
    status: 'active' | 'inactive';
    ports: {
        tagged: string[];
        untagged: string[];
    };
    createdAt?: Date;
}
export interface Port {
    id: string;
    index: number;
    description?: string;
    status: 'up' | 'down';
    speed?: string;
    duplex?: 'auto' | 'full' | 'half';
    vlans: {
        tagged: number[];
        untagged?: number;
    };
    mtu?: number;
    flowControl?: boolean;
    enabled: boolean;
}
export interface CreateVlanCommand {
    vlanId: number;
    name: string;
}
export interface ModifyVlanCommand {
    vlanId: number;
    name?: string;
    newId?: number;
}
export interface AddPortToVlanCommand {
    vlanId: number;
    ports: string[];
    tagged?: boolean;
}
export interface RemovePortFromVlanCommand {
    vlanId: number;
    ports: string[];
}
export interface ConfigurePortCommand {
    portId: string;
    enabled?: boolean;
    speed?: string;
    duplex?: 'auto' | 'full' | 'half';
    description?: string;
    mtu?: number;
    flowControl?: boolean;
}
export interface AuditLogEntry {
    id: number;
    profileId: string;
    command: string;
    result: string;
    success: boolean;
    timestamp: Date;
    details?: Record<string, unknown>;
}
