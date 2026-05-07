import type { SystemInfo, Vlan, Port } from '../../types/ipc.js';

export class ProCurveParser {

  static parseSystemInfo(output: string): SystemInfo {
    const lines = output.split('\n');
    const info: Partial<SystemInfo> = {
      ports: { total: 48, active: 0, inactive: 0 },
    };

    for (const line of lines) {
      const kv = (key: string) => {
        const m = line.match(new RegExp(`${key}\\s*:\\s*(.+)$`));
        return m ? m[1].trim() : null;
      };

      if (/System Name/i.test(line)) info.systemName = kv('System Name') ?? undefined;
      if (/System Contact/i.test(line)) info.systemContact = kv('System Contact') ?? undefined;
      if (/System Location/i.test(line)) info.systemLocation = kv('System Location') ?? undefined;
      if (/Software revision/i.test(line)) info.firmwareVersion = kv('Software revision') ?? undefined;
      if (/ROM Version/i.test(line) && !info.romVersion) info.romVersion = kv('ROM Version') ?? undefined;
      if (/Serial Number/i.test(line)) info.serialNumber = kv('Serial Number') ?? undefined;
      if (/MAC Addr/i.test(line)) info.macAddress = kv('MAC Addr') ?? undefined;
      if (/Up Time/i.test(line)) {
        const m = line.match(/Up Time\s*:\s*(.+?)(?:\s{2,}|$)/);
        if (m) info.systemUptime = m[1].trim();
      }
      if (/Memory\s*[-–]\s*Total/i.test(line)) {
        const m = line.match(/Memory\s*[-–]\s*Total\s*:\s*([\d,]+)/i);
        if (m) info.totalMemory = parseInt(m[1].replace(/,/g, ''), 10);
      }
      // Match "Free : <n>" only when NOT preceded by "Buffers" on the same line
      if (/Free\s*:\s*[\d,]+/.test(line) && !/Buffers/i.test(line) && info.totalMemory && !info.usedMemory) {
        const m = line.match(/Free\s*:\s*([\d,]+)/i);
        if (m) {
          const free = parseInt(m[1].replace(/,/g, ''), 10);
          info.usedMemory = info.totalMemory - free;
          info.memoryUsagePercent = Math.round((info.usedMemory / info.totalMemory) * 100);
        }
      }
      if (/CPU Util/i.test(line)) {
        const m = line.match(/(\d+)\s*%/);
        if (m) info.cpuUsagePercent = parseInt(m[1], 10);
      }
    }

    return {
      model: 'ProCurve 2510G-48',
      firmwareVersion: info.firmwareVersion || 'Unknown',
      romVersion: info.romVersion,
      serialNumber: info.serialNumber || 'Unknown',
      macAddress: info.macAddress,
      systemUptime: info.systemUptime || 'Unknown',
      systemName: info.systemName || 'ProCurve Switch',
      systemContact: info.systemContact || '',
      systemLocation: info.systemLocation || '',
      totalMemory: info.totalMemory || 0,
      usedMemory: info.usedMemory || 0,
      memoryUsagePercent: info.memoryUsagePercent || 0,
      cpuUsagePercent: info.cpuUsagePercent,
      ports: info.ports || { total: 48, active: 0, inactive: 0 },
    };
  }

  static parseVlans(output: string): Vlan[] {
    const vlans: Vlan[] = [];
    const lines = output.split('\n');
    let inTable = false;

    for (const line of lines) {
      if (/VLAN\s+ID\s+Name/i.test(line)) { inTable = true; continue; }
      if (!inTable) continue;
      if (/^[-\s]+$/.test(line)) continue;
      if (line.trim() === '') continue;

      // "  1       DEFAULT_VLAN         Port-based"  (no | separator on this model)
      const m = line.match(/^\s*(\d+)\s+(\S+)\s+(\S+)/);
      if (m) {
        vlans.push({
          id: parseInt(m[1], 10),
          name: m[2],
          status: /port.based|active/i.test(m[3]) ? 'active' : 'inactive',
          ports: { tagged: [], untagged: [] },
        });
      }
    }

    return vlans;
  }

  static parseVlanDetail(output: string, vlanId: number): Vlan {
    const vlan: Vlan = {
      id: vlanId,
      name: `VLAN${vlanId}`,
      status: 'active',
      ports: { tagged: [], untagged: [] },
    };

    const lines = output.split('\n');

    for (const line of lines) {
      if (/Name\s*:/i.test(line)) {
        const m = line.match(/Name\s*:\s*(.+)$/);
        if (m) vlan.name = m[1].trim();
      }
      if (/Status\s*:/i.test(line)) {
        vlan.status = /active|port-based/i.test(line) ? 'active' : 'inactive';
      }
    }

    // Parse port membership section
    // ProCurve shows something like:
    //  Tagged   : 1-4,10
    //  Untagged : 5-9
    // OR column format with Tagged/Untagged columns
    const taggedLine = lines.find(l => /Tagged\s*:/i.test(l) && !/Untagged/i.test(l));
    const untaggedLine = lines.find(l => /Untagged\s*:/i.test(l));

    if (taggedLine) {
      const m = taggedLine.match(/Tagged\s*:\s*(.+)$/i);
      if (m && !/none/i.test(m[1])) vlan.ports.tagged = this.expandPortRange(m[1]);
    }
    if (untaggedLine) {
      const m = untaggedLine.match(/Untagged\s*:\s*(.+)$/i);
      if (m && !/none/i.test(m[1])) vlan.ports.untagged = this.expandPortRange(m[1]);
    }

    return vlan;
  }

  static parsePorts(output: string): Port[] {
    const ports: Port[] = [];
    const lines = output.split('\n');
    let inTable = false;

    for (const line of lines) {
      // Header separator line
      if (/[-]{3,}\s*\+/.test(line)) { inTable = true; continue; }
      if (!inTable) continue;
      if (line.trim() === '') continue;

      // "  1       10/100TX  | Yes     Up     No       100FDx  off   0"
      // Split on | or + to separate port info from link info
      const sides = line.split(/[|+]/);
      if (sides.length < 2) continue;

      const left = sides[0].trim().split(/\s+/);
      const right = sides[1].trim().split(/\s+/);

      const portId = left[0];
      if (!portId || !/^\d+[A-Z]?$/.test(portId)) continue;

      // Columns after | on ProCurve 2510G-48:
      // [0]=FlowCtrl(No/Yes)  [1]=Enabled(Yes/No)  [2]=Status(Up/Down)  [3]=SpeedDuplex
      const enabled = right[1]?.toLowerCase() === 'yes';
      const linkState = right[2]?.toLowerCase() || 'down';
      const mode = right[3] || '';

      let speed = 'auto';
      let duplex: 'auto' | 'full' | 'half' = 'auto';

      if (/(\d+)(fdx|hdx)/i.test(mode)) {
        const m = mode.match(/(\d+)(fdx|hdx)/i);
        if (m) {
          speed = m[1];
          duplex = m[2].toLowerCase() === 'fdx' ? 'full' : 'half';
        }
      }

      ports.push({
        id: portId,
        index: parseInt(portId, 10) || 0,
        type: left[1] || '',
        enabled,
        status: linkState === 'up' ? 'up' : 'down',
        speed,
        duplex,
        vlans: { tagged: [], untagged: undefined },
      });
    }

    return ports;
  }

  static parsePortDetails(output: string, portId: string): Partial<Port> {
    const details: Partial<Port> = {
      id: portId,
      vlans: { tagged: [], untagged: undefined },
    };

    const lines = output.split('\n');

    for (const line of lines) {
      if (/Enabled\s*:/i.test(line)) details.enabled = /yes|enable/i.test(line);
      if (/Link Status\s*:|Status\s*:/i.test(line))
        details.status = /up/i.test(line) ? 'up' : 'down';
      if (/Speed\s*:/i.test(line)) {
        const m = line.match(/(\d+)\s*Mbps/i);
        if (m) details.speed = m[1];
      }
      if (/Duplex\s*:/i.test(line)) {
        details.duplex = /full/i.test(line) ? 'full' : /half/i.test(line) ? 'half' : 'auto';
      }
      if (/Name\s*:/i.test(line) || /Description\s*:/i.test(line)) {
        const m = line.match(/:\s*(.+)$/);
        if (m) details.description = m[1].trim();
      }
      if (/Untagged VLAN\s*:/i.test(line)) {
        const m = line.match(/(\d+)/);
        if (m) details.vlans!.untagged = parseInt(m[1], 10);
      }
      if (/Tagged VLAN\s*:/i.test(line)) {
        const m = line.match(/(\d+)/);
        if (m) details.vlans!.tagged.push(parseInt(m[1], 10));
      }
    }

    return details;
  }

  private static expandPortRange(rangeStr: string): string[] {
    const ports: string[] = [];
    const parts = rangeStr.replace(/\s/g, '').split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [s, e] = part.split('-').map(Number);
        for (let i = s; i <= e; i++) ports.push(String(i));
      } else if (part) {
        ports.push(part);
      }
    }
    return ports;
  }

  static hasError(output: string): boolean {
    return /invalid command|error|unknown command|permission denied|bad command/i.test(output);
  }
}

export default ProCurveParser;
