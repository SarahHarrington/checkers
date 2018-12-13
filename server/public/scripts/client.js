console.log('javascript loaded');

const socket = io();

//Board Things


socket.on('aNewClientConnection', (id) => {
  console.log(id);
})



/***** KEEPS CONNECTION ALIVE FOR BROWSERS THAT TIME OUT *****/
function keepConnectionAlive() {
  setInterval(() => {
    socket.emit('keepConnectionAlive');
  }, 20000)
}
keepConnectionAlive();
