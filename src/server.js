const UDP = require('dgram')

const server = UDP.createSocket('udp4')

const port = 2222

const clients = [];

server.on('message', (message, remote) => {
  const messageString = message.toString();
  console.log(`Received message from ${remote.address}:${remote.port}: ${messageString}`);

  if (command.toLowerCase() === 'stop') {

    const index = clients.findIndex(client => client.address === remote.address && client.port === remote.port);
    if (index !== -1) {
      clients.splice(index, 1);
      console.log(`Client ${remote.address}:${remote.port} has disconnected.`);
      console.log(clients);
    }
  }

  else {
    const existingClient = clients.find(client => client.address === remote.address && client.port === remote.port);

    if (!existingClient) {
      clients.push({ address: remote.address, port: remote.port });
      console.log(`New client connected: ${remote.address}:${remote.port}`);
      console.log(clients);
    }
  }
});

server.on('listening', () => {
  const address = server.address()
  console.log('Listining to ', 'Address: ', address.address, 'Port: ', address.port)
})


server.bind(port)