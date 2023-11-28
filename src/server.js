const UDP = require('dgram')

const server = UDP.createSocket('udp4')

const port = 2222

server.on('listening', () => {
    const address = server.address()
    console.log('Listining to ', 'Address: ', address.address, 'Port: ', address.port)
})