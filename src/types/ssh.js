// SSH and ProCurve specific types
// ProCurve CLI parsing patterns
export const PROCURVE_COMMANDS = {
    SHOW_SYSTEM: 'show system',
    SHOW_VLAN: 'show vlan',
    SHOW_INTERFACES: 'show interfaces brief',
    SHOW_PORT_DETAILS: (port) => `show interfaces ${port}`,
    CONFIGURE_VLAN: (vlanId) => `vlan ${vlanId}`,
    DELETE_VLAN: (vlanId) => `no vlan ${vlanId}`,
    TAG_PORT: (ports) => `tagged ${ports}`,
    UNTAG_PORT: (ports) => `untagged ${ports}`,
    SET_PORT_SPEED: (port, speed) => `interface ${port}\nspeed ${speed}`,
    SET_PORT_DUPLEX: (port, duplex) => `interface ${port}\nduplex ${duplex}`,
    ENABLE_PORT: (port) => `interface ${port}\nno shutdown`,
    DISABLE_PORT: (port) => `interface ${port}\nshutdown`,
    SET_DESCRIPTION: (port, desc) => `interface ${port}\ndescription ${desc}`,
    SET_SYSTEM_NAME: (name) => `system-name "${name}"`,
    SET_SYSTEM_CONTACT: (contact) => `system contact "${contact}"`,
    EXIT_VLAN: 'exit',
    COPY_RUNNING_STARTUP: 'write memory',
};
//# sourceMappingURL=ssh.js.map