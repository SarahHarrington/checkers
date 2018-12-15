console.log('javascript loaded');

const socket = io();

//Board Things


socket.on('aNewClientConnection', (id) => {
  console.log(id);
  
})

socket.on('gameStarted', (game) => {
  console.log(game);
})


/***** KEEPS CONNECTION ALIVE FOR BROWSERS THAT TIME OUT Tabs*****/
//TODO: If I use a cookie, could I track the user somehow?
function keepConnectionAlive() {
  setInterval(() => {
    socket.emit('keepConnectionAlive');
  }, 20000)
}
keepConnectionAlive();
