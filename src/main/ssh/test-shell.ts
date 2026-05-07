import { Client } from 'ssh2';

const config: any = {
  host: '192.168.0.2',
  port: 22,
  username: 'manager',
  password: 'H4BBKPHB@a',
  algorithms: {
    kex: [
      'diffie-hellman-group1-sha1',
      'diffie-hellman-group14-sha1',
      'diffie-hellman-group-exchange-sha1',
      'diffie-hellman-group-exchange-sha256',
    ],
    cipher: [
      'aes128-cbc',
      'aes192-cbc',
      'aes256-cbc',
      '3des-cbc',
    ],
    serverHostKey: [
      'ssh-rsa',
      'ssh-dss',
    ],
    hmac: [
      'hmac-sha1',
      'hmac-sha1-96',
      'hmac-md5',
    ],
  },
};

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.shell((err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      console.log('Stream :: close');
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
      const output = data.toString();
      if (output.includes('Press any key to continue')) {
          stream.write('\n');
      }
      if (output.includes('>') || output.includes('#')) {
          // Just run one command for now
          stream.write('show system\n');
          setTimeout(() => {
              stream.write('exit\n');
              stream.write('exit\n'); // Sometimes need twice
          }, 2000);
      }
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect(config);
