console.log('javascript loaded');

const socket = io();
//Board Things

let boardSpaces = document.querySelectorAll('.playable');
let startGameButton = document.querySelector('#start-game');
let playerDeclareMessage = document.querySelector('#player-declare');
let gameMessage = document.querySelector('#game-message');

socket.on('aNewClientConnection', (id) => {
  console.log(id);
})

socket.on('gameStarted', (game) => {
  displayGame(game);
})

socket.on('playerDeclare', (player) => {
  console.log(player.player);
  playerDeclare(player);
})

socket.on('gameReadyToStart', () => {
  console.log('ready to start the game message should update')
  gameMessage.innerHTML = 'Press Start Game to Begin!';
})

function displayGame(game) {
  console.log(game);
  for (let i = 0; i < game.state.length; i++) {
    if (game.state[i].player === 1) {
      let playerOnePiece = document.createElement('div');
      playerOnePiece.classList.add('game-piece');
      playerOnePiece.classList.add('player-one-piece');
      playerOnePiece.setAttribute('id', 'p1');
      playerOnePiece.setAttribute('draggable', true);
      boardSpaces[i].appendChild(playerOnePiece);
    }
    if (game.state[i].player === 2) {
      let playerTwoPiece = document.createElement('div');
      playerTwoPiece.classList.add('game-piece');
      playerTwoPiece.classList.add('player-two-piece');
      playerTwoPiece.setAttribute('id', 'p2');
      playerTwoPiece.setAttribute('draggable', true);
      boardSpaces[i].appendChild(playerTwoPiece);
    }
  }
  let activePlayer = document.querySelector(`#${game.currentTurn.player}-side`);
  console.log(activePlayer);
  activePlayer.classList.add('glow');
  gameMessage.innerHTML = '';
}

function playerDeclare(player) {
  if (player.player === 'p1') {
    playerDeclareMessage.innerHTML = 'Player 1';
    gameMessage.innerHTML = 'Wait for another player, or press Start Game!'
  } if (player.player === 'p2') {
    playerDeclareMessage.innerHTML = 'Player 2';
  }
}

function startGame() {
  console.log('start game button pushed')
  socket.emit('startTheGame'); 
}

function dragStartHandler(e) {
  e.dataTransfer.setData("html", e.target.id);
  currentTurn.activePiece = e.target;
  if (isNaN(parseInt(e.target.parentElement.id))) {
    currentTurn.startSpace = e.target.parentElement.parentElement.id;
  } else {
    currentTurn.startSpace = e.target.parentElement.id;
  }
}

function dragoverHandler(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function dropHandler(e) {
  console.log(e);
  e.preventDefault();
  if (currentTurn.endSpace === 'p1' || currentTurn.endSpace === 'p2') {
    gameMessageDisplay.innerHTML = 'That move is not valid';
    setTimeout(clearMessage, 4000);
    return;
  }
  else {
    socket.emit('checkTheMove', );
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


startGameButton.addEventListener('click', startGame);