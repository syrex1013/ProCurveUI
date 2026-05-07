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
export declare const PROCURVE_COMMANDS: {
    readonly SHOW_SYSTEM: "show system";
    readonly SHOW_VLAN: "show vlan";
    readonly SHOW_INTERFACES: "show interfaces brief";
    readonly SHOW_PORT_DETAILS: (port: string) => string;
    readonly CONFIGURE_VLAN: (vlanId: number) => string;
    readonly DELETE_VLAN: (vlanId: number) => string;
    readonly TAG_PORT: (ports: string) => string;
    readonly UNTAG_PORT: (ports: string) => string;
    readonly SET_PORT_SPEED: (port: string, speed: string) => string;
    readonly SET_PORT_DUPLEX: (port: string, duplex: string) => string;
    readonly ENABLE_PORT: (port: string) => string;
    readonly DISABLE_PORT: (port: string) => string;
    readonly SET_DESCRIPTION: (port: string, desc: string) => string;
    readonly SET_SYSTEM_NAME: (name: string) => string;
    readonly SET_SYSTEM_CONTACT: (contact: string) => string;
    readonly EXIT_VLAN: "exit";
    readonly COPY_RUNNING_STARTUP: "write memory";
};
