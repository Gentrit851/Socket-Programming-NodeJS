const UDP = require('dgram')

const readline = require('readline')

const client = UDP.createSocket('udp4')

const port = 2222

const hostname = 'localhost'


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout

});

function searchPrompt() {
  rl.question('Send to server : ', (answer) => {
    const packet = Buffer.from(answer)
    if (answer.toLowerCase() !== "stop" && answer.length !== 0) {
      sendMessage(packet);
    } else {
      console.log("Connection has been stoped by the 'stop' command !");
      sendDisconnection(packet);

      setTimeout(() => {
        rl.close();
        client.close();
      }, 3000);
    }
  });
}

searchPrompt();

function sendMessage(packet) {
  client.send(packet, port, hostname, (err) => {
    if (err) {
      console.error('Failed to send packet!!');
    } else {
      console.log('Packet sent!!');

      setTimeout(() => {
        searchPrompt();
      }, 3000);
    }
  });
}
function sendDisconnection(packet) {
  client.send(packet, port, hostname, (err) => {
    if (err) {
      console.error('Failed to send disconnection packet!!');
    } else {
      console.log('Disconnection packet sent!!');
    }
  });
}

client.on('message', (message, remote) => {
  const messageString = message.toString();
  console.log(`Received message from ${remote.address}:${remote.port}: ` + `\n` + `${messageString}`);
  searchPrompt();
});