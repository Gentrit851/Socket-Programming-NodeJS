const UDP = require('dgram')

const fs = require('fs');

const { exec } = require('child_process');

const server = UDP.createSocket('udp4')

const port = 2222

const clientPermissionsMap = new Map();

server.on('message', (message, remote) => {
  const messageString = message.toString();
  console.log(`Received message from ${remote.address}:${remote.port}: ${messageString}`);

  const [command, fileName, fileContent] = messageString.split('|');

  switch (command.toLowerCase()) {
    case 'stop':
      stop(remote);
      break;

    case 'readfile':
      readFile(fileName, remote);
      break;

    case 'writefile':
      performAction(fileName, fileContent, remote, 'write');
      break;

    case 'runfile':
      performAction(fileName, fileContent, remote, 'execute');
      break;

    case 'listfiles':
      listFiles(remote);
      break;

    default:
      const existingClient = clientPermissionsMap.get(client => client.address === remote.address && client.port === remote.port);
      if (!existingClient) {
        setPermissions(remote);
      }
      break;
  }
});

function readFile(fileName, remote) {
  fs.readFile(fileName, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
    } else {
      const responseMessage = `File content:\n${data}`;
      server.send(Buffer.from(responseMessage), remote.port, remote.address, (err) => {
        if (err) {
          console.error(`Error sending file content to ${remote.address}:${remote.port}: ${err.message}`);
        } else {
          console.log(`File content sent to ${remote.address}:${remote.port}`);
        }
      });
    }
  });
}

function writeFile(fileName, fileContent, remote) {
  fs.writeFile(fileName, fileContent, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing to file: ${err.message}`);
    } else {
      const responseMessage = `File ${fileName} successfully updated.`;
      server.send(Buffer.from(responseMessage), remote.port, remote.address, (err) => {
        if (err) {
          console.error(`Error sending success response to ${remote.address}:${remote.port}: ${err.message}`);
        } else {
          console.log(`File ${fileName} successfully updated for ${remote.address}:${remote.port}`);
        }
      });
    }
  });
}

function runFile(fileName, remote) {
  exec(`${fileName}`, (error, stdout) => {
    if (error) {
      console.error(`Error running file ${fileName}: ${error.message}`);
    } else {
      const responseMessage = `File ${fileName} executed:\n${stdout}`;
      server.send(Buffer.from(responseMessage), remote.port, remote.address, (err) => {
        if (err) {
          console.error(`Error sending response to ${remote.address}:${remote.port}: ${err.message}`);
        } else {
          console.log(`File ${fileName} executed for ${remote.address}:${remote.port}`);
        }
      });
    }
  });
}


server.on('listening', () => {
  const address = server.address()
  console.log('Listining to ', 'Address: ', address.address, 'Port: ', address.port)
})


server.bind(port)