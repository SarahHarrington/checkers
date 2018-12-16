console.log('javascript loaded');

const socket = io();
//Board Things

let boardSpaces = document.querySelectorAll('.playable');
// let startGame = document.querySelector('#start-game').addEventListener('startGame', startGame);

socket.on('aNewClientConnection', (id) => {
  console.log(id);

})

socket.on('gameStarted', (game) => {
  console.log('two players have joined');
  displayGame(game);
})

function displayGame(game) {
  console.log('in the game load', game.state)
  for (let i = 0; i < game.state.length; i++) {
    // console.log(game.state[i])
    console.log('in the loop!')
    if (game.state[i].player === 1) {
      let playerOnePiece = document.createElement('div');
      playerOnePiece.classList.add('game-piece');
      playerOnePiece.classList.add('player-one-piece');
      playerOnePiece.setAttribute('id', 'p1');
      boardSpaces[i].appendChild(playerOnePiece);
    }
    if (game.state[i].player === 2) {
      let playerOnePiece = document.createElement('div');
      playerOnePiece.classList.add('game-piece');
      playerOnePiece.classList.add('player-two-piece');
      playerOnePiece.setAttribute('id', 'p2');
      boardSpaces[i].appendChild(playerOnePiece);
    }
  }
}

// function startGame() {

// }


// let playerOnePiece = document.createElement('div');
// playerOnePiece.classList.add('game-piece');
// playerOnePiece.classList.add('player-one-piece');
// playerOnePiece.setAttribute('id', 'p1');
// boardSpaces[i].appendChild(playerOnePiece);

/***** KEEPS CONNECTION ALIVE FOR BROWSERS THAT TIME OUT Tabs*****/
//TODO: If I use a cookie, could I track the user somehow?
function keepConnectionAlive() {
  setInterval(() => {
    socket.emit('keepConnectionAlive');
  }, 20000)
}
keepConnectionAlive();
