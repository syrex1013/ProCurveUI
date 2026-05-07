import { SSHClient } from './client.js';

async function testConfig() {
  const client = new SSHClient();
  try {
    console.log('Connecting to 192.168.0.2...');
    await client.connect({
      host: '192.168.0.2',
      port: 22,
      username: 'manager',
      password: 'H4BBKPHB@a',
    });
    console.log('Connected!');

    console.log('\n--- Entering configure mode ---');
    await client.execute('configure');
    
    console.log('\n--- Help in configure mode ---');
    const helpOutput = await client.execute('help');
    console.log(helpOutput);

    console.log('\n--- Testing VLAN config help ---');
    const vlanHelp = await client.execute('vlan 1 help');
    console.log(vlanHelp);

    console.log('\n--- Testing Interface config help ---');
    const intHelp = await client.execute('interface 1 help');
    console.log(intHelp);

    await client.disconnect();
    console.log('\nDisconnected.');
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

testConfig();
