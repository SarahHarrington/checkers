console.log('javascript loaded');

const socket = io();
//Board Things

let allSpaces = document.querySelectorAll('.playable');

console.log('allthespaces', allSpaces);


socket.on('aNewClientConnection', (id) => {
  console.log(id);
  
})

socket.on('gameStarted', (game) => {
  console.log(game);
  displayGame(game);
})

function displayGame(game) {
  for (let i = 0; i < game.state; i++) {
    if (game.state[i].player = 1) {
      
    }
  }
}




/***** KEEPS CONNECTION ALIVE FOR BROWSERS THAT TIME OUT Tabs*****/
//TODO: If I use a cookie, could I track the user somehow?
function keepConnectionAlive() {
  setInterval(() => {
    socket.emit('keepConnectionAlive');
  }, 20000)
}
keepConnectionAlive();
