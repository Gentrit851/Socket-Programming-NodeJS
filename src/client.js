const UDP = require('dgram')

const client = UDP.createSocket('udp4')

const port = 2222

const hostname = 'localhost'
client.on('message', (message, info) => {
    
    console.log('Address: ', info.address, 'Port: ', info.port, 'Size: ', info.size)
    
    console.log('Message from server', message.toString())
  })
  
  const packet = Buffer.from('This is a message from client')
  
  client.send(packet, port, hostname, (err) => {
    if (err) {
      console.error('Failed to send packet !!')
    } else {
      console.log('Packet send !!')
    }
  })