# ProCurve Manager

A sleek, modern Electron application for managing HP ProCurve switches via SSH.

![Dashboard Preview](images/dashboard.png)

## Features

- **Profile Management:** Save multiple switch profiles with encrypted passwords.
- **Real-time Monitoring:** View system info, memory usage, CPU, and uptime.
- **Port Management:** Visual port grid, detailed port configuration (speed, duplex, flow control, enable/disable).
- **VLAN Management:** Create, delete, and rename VLANs; manage port memberships (tagged/untagged).
- **Embedded Terminal:** Integrated SSH terminal for direct CLI access.
- **Audit Logging:** Track all commands sent to the switch with their results.

## Tech Stack

- **Frontend:** React, TypeScript, Vanilla CSS (Tailwind for layout).
- **Backend:** Electron, Node.js.
- **Communication:** SSH2 for switch interaction.
- **Storage:** SQLite for local profiles and audit logs.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/[username]/ProCurveUI.git
   cd ProCurveUI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Screenshots

| Overview | Ports |
| :---: | :---: |
| ![Overview](images/overview.png) | ![Ports](images/ports.png) |

| VLANs | Terminal |
| :---: | :---: |
| ![VLANs](images/vlans.png) | ![Terminal](images/terminal.png) |

## License

MIT
