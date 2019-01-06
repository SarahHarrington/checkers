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

socket.on('turnComplete', (game) => {
  updateTheGame(game);
})

function displayGame(game) {
  console.log(game);
  for (let i = 0; i < game.state.length; i++) {
    if (game.state[i].player === 1) {
      let playerOnePiece = document.createElement('div');
      playerOnePiece.classList.add('game-piece');
      playerOnePiece.classList.add('player-one-piece');
      playerOnePiece.setAttribute('id', '1');
      playerOnePiece.setAttribute('draggable', true);
      playerOnePiece.setAttribute('ondragstart', 'dragStartHandler(event)')
      boardSpaces[i].appendChild(playerOnePiece);
    }
    if (game.state[i].player === 2) {
      let playerTwoPiece = document.createElement('div');
      playerTwoPiece.classList.add('game-piece');
      playerTwoPiece.classList.add('player-two-piece');
      playerTwoPiece.setAttribute('id', '2');
      playerTwoPiece.setAttribute('draggable', true);
      playerTwoPiece.setAttribute('ondragstart', 'dragStartHandler(event)')
      boardSpaces[i].appendChild(playerTwoPiece);
    }
  }
  let activePlayer = document.querySelector(`#p${game.currentTurn.player}-side`);
  console.log(activePlayer);
  activePlayer.classList.add('glow');
  gameMessage.innerHTML = '';
}

function updateTheGame(game) {
  console.log('update the game board')
  
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

let activeTurn = {
  piece: '',
  player: '',
  startSpace: null,
  endSpace: null
}

function dragStartHandler(e) {
  e.dataTransfer.setData("html", e.target.id);
  console.log('drag start', e.target);
  activeTurn.piece = e.target;
  activeTurn.player = e.target.id;
  if (isNaN(parseInt(e.target.parentElement.id))) {
    activeTurn.startSpace = parseInt(e.target.parentElement.parentElement.id);
  } else {
    activeTurn.startSpace = parseInt(e.target.parentElement.id);
  }
}

function dragoverHandler(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function dropHandler(e) {
  activeTurn.endSpace = parseInt(e.target.id);
  e.preventDefault();
  // if (activeTurn.endSpace === 'p1' || activeTurn.endSpace === 'p2') {
  //   gameMessageDisplay.innerHTML = 'That move is not valid';
  //   setTimeout(clearMessage, 4000);
  //   return;
  // }
  // else {
    console.log(activeTurn)
    socket.emit('checkIfValidMove', activeTurn);
  // }
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