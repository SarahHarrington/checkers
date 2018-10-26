console.log('javascript loaded');

const socket = io();

//Board Things
const boardSpaces = [...document.querySelectorAll('.playable')];
const capturedPieces = document.querySelector('.captured-pieces');
const gameMessageDisplay = document.querySelector('.game-message');
const startGameButton = document.getElementById('start-game');
const currentPlayerDisplay = document.getElementById('current-turn');
const playerDeclare = document.querySelector('.playerDeclare');
const playerOneGlow = document.querySelector('#p1-side');
const playerTwoGlow = document.querySelector('#p2-side');
const endTheGameButton = document.querySelector('#end-game');
const chatDisplay = document.querySelector('#chat-display');
const chatMessage = document.querySelector('#chat-message');
const chatSubmit = document.querySelector('#chat-submit');

let currentTurn = {
  player: null, //currently tracking the piece type for player
  startSpace: null, // the piece the drag start action happened on
  endSpace: null, //The space in the drop
  jumpSpace: null,
  activePiece: null, //the game piece selected
  isJump: false, //if the move is a jump
  endingJump: false,  //notifies that the jump turn is ending
  king: false, 
}

for (let i = 0; i < boardSpaces.length; i++) {
  boardSpaces[i].setAttribute('id', i + 1);
  boardSpaces[i].setAttribute('ondragover', 'dragoverHandler(event)');
  boardSpaces[i].setAttribute('ondrop', 'dropHandler(event)')
}

for (let i = 0; i <= 11; i++) {
  let playerOnePiece = document.createElement('div');
  playerOnePiece.classList.add('game-piece');
  playerOnePiece.classList.add('player-one-piece');
  playerOnePiece.setAttribute('id', 'p1');
  boardSpaces[i].appendChild(playerOnePiece);
}

for (let i = 20; i <= 31; i++) {
  let playerTwoPiece = document.createElement('div');
  playerTwoPiece.classList.add('game-piece');
  playerTwoPiece.classList.add('player-two-piece');
  playerTwoPiece.setAttribute('id', 'p2');
  boardSpaces[i].appendChild(playerTwoPiece);
}

//Player pieces
const playerOnePieces = [...document.querySelectorAll('.player-one-piece')];
const playerTwoPieces = [...document.querySelectorAll('.player-two-piece')];

socket.on('aNewClientConnection', (id) => {
  console.log(id);
})

socket.on('playerHasJoined', () => {
  chatDisplay.innerHTML = '<li>Player 2 has joined the game!</li>';
})

socket.on('disconnect', () => {
  console.log('this socket disconnected', socket.id)
})

socket.on('playerDisconnected', () => {
  gameMessageDisplay.innerHTML = 'The other player has disconnected.';
  //TODO: add in an update for the player two socket id to update?
})

socket.on('changePlayerTurn', serverTurn => {
  currentTurn.player = serverTurn.player;
  changeTurn(currentTurn.player);
})

socket.on('updateBoard', serverTurn => {
  updateBoard(serverTurn);
})

socket.on('invalidMove', () => {
  console.log('that move is invalid');
  gameMessageDisplay.classList.remove('fade-out');
  gameMessageDisplay.innerHTML = 'That move is not valid';
  setTimeout(clearMessage, 4000);
})

socket.on('endOfTheTurn', serverTurn => {
  endOfTheTurn(serverTurn);
})

socket.on('playerOne', (gameID) => {
  console.log('p1 game ID', gameID);
  playerDeclare.innerHTML = `player one!`;
  playerDeclare.classList.add('playerDeclareP1');
})

socket.on('playerTwo', (gameID) => {
  console.log('p2 game ID', gameID)
  playerDeclare.innerHTML = `player two!`;
  playerDeclare.classList.add('playerDeclareP2');
})

socket.on('updateTheChat', (chatLog) => {
  console.log('Chat log', chatLog);
  updateChat(chatLog);
})

socket.on('noOneHasJoinedGame', () => {
  console.log('no one has joined the game')
  chatDisplay.innerHTML = 'No one has joined the game.';
  setTimeout(clearMessage, 4000);
})

socket.on('playerOneWins', () => {
  gameMessageDisplay.innerHTML = 'Player One Wins!';
})

socket.on('playerTwoWins', () => {
  gameMessageDisplay.innerHTML = 'Player Two Wins!';
})

socket.on('drawGame', () => {
  gameMessageDisplay.innerHTML = 'This game was a draw! Thanks for playing!'
})

// ===================== FUNCTIONS =======================

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
  currentTurn.endSpace = e.target.id;
  e.preventDefault();
  if (currentTurn.endSpace === 'p1' || currentTurn.endSpace === 'p2') {
    gameMessageDisplay.innerHTML = 'That move is not valid';
    setTimeout(clearMessage, 4000);
    return;
  }
  else {
    socket.emit('checkIfValidMove', currentTurn);
  }
}

function clearMessage() {
  gameMessageDisplay.classList.add('fade-out');
}

//starts the game when button clicked
function startTheGame() {
  socket.emit('startTheGame');
  startGameButton.classList.add('hide');
  startGameButton.classList.remove('game-button');
  endTheGameButton.classList.remove('hide');
  endTheGameButton.classList.add('game-button');
}

//updates the board
function updateBoard(serverTurn) {
  let capturedPiece = document.createElement('div');
  document.getElementById(serverTurn.endSpace).appendChild(document.getElementById(serverTurn.startSpace).firstChild);
  let jumpedPiece = document.getElementById(serverTurn.jumpSpace).firstChild;
  console.log('jumped piece', jumpedPiece);
  document.getElementById(serverTurn.jumpSpace).removeChild(jumpedPiece);
  if (serverTurn.player === 'p1') {
    capturedPiece.classList.add('p2-capture');
    document.querySelector('.p1-pieces').appendChild(capturedPiece);
  }
  if (serverTurn.player === 'p2') {
    capturedPiece.classList.add('p1-capture');
    document.querySelector('.p2-pieces').appendChild(capturedPiece);
  }
  console.log(serverTurn);
}

//Changes the pieces to draggable based on the player turn
function changeTurn(playerTurn) {
  if (playerTurn === 'p1') {
    playerTwoGlow.classList.remove('glow');
    playerOneGlow.classList.add('glow');
    console.log('player 1 turn -------------------------------');
    playerOnePieces.forEach (piece => {
      piece.setAttribute('draggable', true);
      piece.setAttribute('ondragstart', 'dragStartHandler(event)');
    })
    playerTwoPieces.forEach(piece => {
      piece.removeAttribute('draggable', true);
      piece.removeAttribute('ondragstart', 'dragStartHandler(event)');
    })
    currentPlayerDisplay.innerHTML = '<span class="p1">Player 1 go!</span>';
  }
  if (playerTurn === 'p2') {
    playerTwoGlow.classList.add('glow');
    playerOneGlow.classList.remove('glow');
    console.log('player 2 turn ----------------------------');
    playerTwoPieces.forEach (piece => {
      piece.setAttribute('draggable', true);
      piece.setAttribute('ondragstart', 'dragStartHandler(event)');
    })
    playerOnePieces.forEach(piece => {
      piece.removeAttribute('draggable', true);
      piece.removeAttribute('ondragstart', 'dragStartHandler(event)');
    })
    currentPlayerDisplay.innerHTML = '<span class="p2">Player 2 Go!</span>';
  }
}

function endOfTheTurn(serverTurn) {
  let capturedPiece = document.createElement('div');
  let activePiece = document.getElementById(serverTurn.startSpace).firstChild;;
  if (serverTurn.jump === true) {
    document.getElementById(serverTurn.endSpace).appendChild(activePiece);
    let jumpedPiece = document.getElementById(serverTurn.jumpSpace).firstChild;
    console.log(jumpedPiece);
    document.getElementById(serverTurn.jumpSpace).removeChild(jumpedPiece);
    if (serverTurn.player === 'p1') {
      capturedPiece.classList.add('p2-capture');
      document.querySelector('.p1-pieces').appendChild(capturedPiece);
    }
    if (serverTurn.player === 'p2') {
      capturedPiece.classList.add('p1-capture');
      document.querySelector('.p2-pieces').appendChild(capturedPiece);
    }
  }
  if (serverTurn.king === true) {
    if (serverTurn.player === 'p1') {
      document.getElementById(serverTurn.endSpace).appendChild(activePiece);
      activePiece.innerHTML = '<i class="fas fa-crown p1"></i>';
    }
    if (serverTurn.player === 'p2') {
      document.getElementById(serverTurn.endSpace).appendChild(activePiece);
      activePiece.innerHTML = '<i class="fas fa-crown p2"></i>';
    }
  } else {
    document.getElementById(serverTurn.endSpace).appendChild(activePiece);
  }
}

function playersEndingTheGame() {

}

/***** CHAT FUNCTIONS *****/
function sendChatMessage(e) {
  e.preventDefault();
  socket.emit('newChatMessage', chatMessage.value);
  chatMessage.value = '';
}

function updateChat(chatLog) {
  chatDisplay.innerHTML = '';
  chatLog.forEach(chat => {
    let chatMessage = document.createElement('li');
    if (chat.player === 'Player One') {
      chatMessage.innerHTML = `<span class='p1'>${chat.player}</span>: ${chat.message}`;
    }
    if (chat.player === 'Player Two') {
      chatMessage.innerHTML = `<span class='p2'>${chat.player}</span>: ${chat.message}`;
    }
    chatDisplay.appendChild(chatMessage);
  })
}

/***** KEEPS CONNECTION ALIVE FOR BROWSERS THAT TIME OUT *****/
function keepConnectionAlive() {
  setInterval(() => {
    socket.emit('keepConnectionAlive');
  }, 20000)
}
keepConnectionAlive();

/***** EVENT LISTENERS *****/
startGameButton.addEventListener('click', startTheGame);
endTheGameButton.addEventListener('click', playersEndingTheGame);
chatSubmit.addEventListener('click', sendChatMessage);