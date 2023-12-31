const UDP = require('dgram');

const fs = require('fs');

const { exec } = require('child_process');

const server = UDP.createSocket('udp4');

const port = 2222;

const path = require('path');

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

function setPermissions(remote) {
  const clientPermissions = {
    write: true,
    execute: true
  };

  checkIfFirstClient(clientPermissions);

  clientPermissionsMap.set(`${remote.address}:${remote.port}`, clientPermissions);
  console.log(`New client connected: ${remote.address}:${remote.port}`);
  console.log('Map of Clients looks like : ', clientPermissionsMap);
}

function checkIfFirstClient(clientPermissions) {
  if (clientPermissionsMap.size == 0) {
    clientPermissions.write = true;
    clientPermissions.execute = true;
  } else {
    clientPermissions.write = false;
    clientPermissions.execute = false;
  }
}

function stop(remote) {
  const index = clientPermissionsMap.get(client => client.address === remote.address && client.port === remote.port);
  if (index !== -1) {
    clientPermissionsMap.delete(`${remote.address}:${remote.port}`);
    console.log(`Client ${remote.address}:${remote.port} has disconnected.`);

    const [firstKey] = clientPermissionsMap.keys();
    clientPermissionsMap.set(firstKey, {
      write: true,
      execute: true
    });

    console.log("Now the Map of Clients looks like : ", clientPermissionsMap);
  }
}

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

function sendPermissionDenied(remote, fileName, action) {
  const responseMessage = `Permission denied: ${action} access to file ${fileName} is not allowed.`;
  sendResponseMessage(responseMessage, remote);
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
  const filePath = path.join(__dirname, 'serverfiles', fileName);
  fs.access(filePath, fs.constants.X_OK, (err) => {
    if (err) {
      ENOENTerror("running",err,fileName,remote)
    } else if (fileName.endsWith('.js')) {
      executeFile(`node "${filePath}"`, fileName, remote);
    }
    else {
      executeFile(`"${filePath}"`, fileName, remote);
    }
  });
}

function executeFile(path, filename, remote) {
  exec(path, (error, stdout) => {
    if (error) {
      console.error(`Error running file ${filename}: ${error.message}`);
    } else {
      const responseMessage = `File ${filename} executed:\n${stdout}`;
      sendResponseMessage(responseMessage, remote);
    }
  });
}

function ENOENTerror(action,err,fileName,remote){
  if (err.code === 'ENOENT') {
    const responseMessage = `File not found: ${fileName}`;
    sendResponseMessage(responseMessage, remote);
  } else {
    console.error(`Error while ${action} the file: ${err.message}`);
  }
} 

function sendResponseMessage(responseMessage, remote) {
  server.send(Buffer.from(responseMessage), remote.port, remote.address, (err) => {
    if (err) {
      console.error(`An error occured while sending the response to: ${remote.address}:${remote.port}: ${err.message}`);
    } else {
      console.log(`Response sent succesfully to : ${remote.address}:${remote.port}`);
    }
  });
}


server.on('listening', () => {
  const address = server.address();
  console.log(`Server listening on ${address.address}:${address.port}`);
});

server.bind(port, '192.168.0.23');