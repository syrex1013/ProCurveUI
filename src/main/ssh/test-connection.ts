import { SSHClient } from './client.js';

async function test() {
  const client = new SSHClient();
  try {
    console.log('Connecting to 192.168.0.2...');
    await client.connect({
      host: '192.168.0.2',
      port: 22,
      username: 'manager',
      password: 'H4BBKPHB@a',
    });
    console.log('Connected successfully!');

    const commands = [
      'show system',
      'show vlan',
      'show interfaces brief',
      'help'
    ];

    for (const cmd of commands) {
      console.log(`\n=========================================`);
      console.log(`EXECUTING: ${cmd}`);
      console.log(`=========================================`);
      try {
        const result = await client.execute(cmd);
        console.log(result);
      } catch (e) {
        console.error(`Error executing ${cmd}:`, e.message);
      }
    }

    await client.disconnect();
    console.log('\nDisconnected.');
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

test();
