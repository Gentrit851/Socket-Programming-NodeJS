const UDP = require('dgram')
const { readFile } = require('fs')

const client = UDP.createSocket('udp4')

const port = 2222

const hostname = 'localhost'
client.on('message', (message, info) => {
    
    console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
    
    console.log('Message from server', message.toString())
  })
  
 const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  
  });
  function searchPrompt(){
    r1.question('Send to server : ',(answer) => {
      const packet = Buffer.from(answer)
      if(answer.toLowerCase() !== "stop" && answer.length !== 0){
        sendMessage(packet);
      }else{
        console.log("Connection has been stoped by the 'stop' command !");
        sendDiconnection(packet);

        setTimeout(() => {
          rl.close();
          client.close();
        },3000);
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