const UDP = require('dgram')

const fs = require('fs');

const { exec } = require('child_process');

const server = UDP.createSocket('udp4')

const port = 2222

const path = require('path')

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

function performAction(fileName, fileContent, remote, action) {
  const permissions = clientPermissionsMap.get(`${remote.address}:${remote.port}`);
  if (permissions && permissions.write && permissions.execute) {
    if (action === `write`) {
      writeFile(fileName, fileContent, remote);
    }
    else if (action === 'execute') {
      runFile(fileName, remote);
    }
  } else {
    sendPermissionDenied(remote, fileName, action);
  }
}

function listFiles(remote) {
  fs.readdir('./serverfiles', (err, files) => {
    if (err) {
      console.error(`Error reading directory: ${err.message}`);
    } else {
      const fileList = files.join('\n');
      const responseMessage = `Files you can read:\n${fileList}`;
      sendResponseMessage(responseMessage, remote);
    }
  });
}

function readFile(fileName, remote) {
  const filePath = path.join(__dirname, 'serverfiles', fileName);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      ENOENTerror("reading",err,fileName,remote);
    } else {
      const responseMessage = `File content:\n${data}`;
      sendResponseMessage(responseMessage, remote);
    }
  });
}


function writeFile(fileName, fileContent, remote) {
  const filePath = path.join(__dirname, 'serverfiles', fileName);
  fs.writeFile(filePath, fileContent || '', 'utf8', (err) => {
    if (err) {
      ENOENTerror("writing",err,fileName,remote);
    } else {
      const responseMessage = `File ${fileName} successfully updated.`;
      sendResponseMessage(responseMessage, remote);
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