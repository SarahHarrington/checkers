console.log('javascript loaded');

const socket = io();

//Board Things
const boardSpaces = [...document.querySelectorAll('.playable')];
const capturedPieces = document.querySelector('.captured-pieces');
const gameMessageDisplay = document.querySelector('.game-message');
const startGameButton = document.getElementById('start-game').addEventListener('click', startTheGame);
const currentPlayerDisplay = document.getElementById('current-turn');
const playerDeclare = document.querySelector('.playerDeclare');

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

socket.on('disconnect', () => {
  console.log('this socket disconnected', socket.id)
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
})

socket.on('endOfTheTurn', serverTurn => {
  console.log('server Turn', serverTurn);
  endOfTheTurn(serverTurn);
})

socket.on('playerOne', (gameID) => {
  console.log('p1 game ID', gameID)
  playerDeclare.innerHTML = `You are player one!`;
  playerDeclare.classList.add('playerDeclareP1');
})

socket.on('playerTwo', (gameID) => {
  console.log('p2 game ID', gameID)
  playerDeclare.innerHTML = `You are player two!`;
  playerDeclare.classList.add('playerDeclareP2');
})

socket.on('viewingGame', () => {
  playerDeclare.innerHTML = `You're spectating the current game!`;
})

socket.on('viewingGameInProgress', (gameState) => {
  playerDeclare.innerHTML = `You're spectating the current game!`;
  console.log(gameState);
  displayCurrentGameInProgress(gameState);
})

// ===================== FUNCTIONS =======================

function dragStartHandler(e) {
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
  console.log('in the drop handler', currentTurn);
  e.preventDefault();
  if (currentTurn.endSpace === 'p1' || currentTurn.endSpace === 'p2') {
    console.log('in the drop if')
    return;
  }
  else {
    socket.emit('checkIfValidMove', currentTurn);
  }
}

//starts the game when button clicked
function startTheGame() {
  socket.emit('startTheGame');
}

//updates the board
function updateBoard(serverTurn) {
  document.getElementById(serverTurn.endSpace).appendChild(document.getElementById(serverTurn.startSpace).firstChild);
  let jumpedPiece = document.getElementById(serverTurn.jumpSpace).firstChild;
  document.getElementById(serverTurn.jumpSpace).removeChild(jumpedPiece);
}

//Changes the pieces to draggable based on the player turn
function changeTurn(playerTurn) {
  if (playerTurn === 'p1') {
    console.log('player 1 turn -------------------------------');
    playerOnePieces.forEach (piece => {
      piece.setAttribute('draggable', true);
      piece.setAttribute('ondragstart', 'dragStartHandler(event)');
    })
    playerTwoPieces.forEach(piece => {
      piece.removeAttribute('draggable', true);
      piece.removeAttribute('ondragstart', 'dragStartHandler(event)');
    })
    currentPlayerDisplay.innerHTML = '<p>Player 1 Go!</p>'
  }
  if (playerTurn === 'p2') {
    console.log('player 2 turn ----------------------------');
    playerTwoPieces.forEach (piece => {
      piece.setAttribute('draggable', true);
      piece.setAttribute('ondragstart', 'dragStartHandler(event)');
    })
    playerOnePieces.forEach(piece => {
      piece.removeAttribute('draggable', true);
      piece.removeAttribute('ondragstart', 'dragStartHandler(event)');
    })
    currentPlayerDisplay.innerHTML = '<p>Player 2 Go!</p>'
  }
}

function endOfTheTurn(serverTurn) {
  console.log(serverTurn);
  let activePiece = document.getElementById(serverTurn.startSpace).firstChild;;
  if (serverTurn.jump === true) {
    console.log('do the jump')
    console.log('jumpSpace', serverTurn.jumpSpace);
    document.getElementById(serverTurn.endSpace).appendChild(activePiece);
    let jumpedPiece = document.getElementById(serverTurn.jumpSpace).firstChild;
    document.getElementById(serverTurn.jumpSpace).removeChild(jumpedPiece);
  }
  if (serverTurn.king === true) {
    console.log('figure out how to add king class?');
    document.getElementById(serverTurn.endSpace).appendChild(activePiece);
    activePiece.innerHTML = '<i class="fas fa-crown"></i>';
  } else {
    console.log(currentTurn.activePiece);
    document.getElementById(serverTurn.endSpace).appendChild(activePiece);
  }
}

function displayCurrentGameInProgress(gameState) {
  console.log('in the update the thing page')
  // for (let i = 1; i < gameState.length; i++) {
  //   console.log('in the loop', i);
  //   console.log(boardSpaces[i]);
  //   console.log(gameState[i].player);
  //   if (gameState[i].player === 'p1') {
  //     console.log('in the p1 if')
  //     let playerOnePiece =  document.createElement('div');
  //     playerOnePiece.classList.add('game-piece');
  //     playerOnePiece.classList.add('player-one-piece');
  //     playerOnePiece.setAttribute('id', 'p1');
  //     boardSpaces[i].appendChild(playerOnePiece);
  //     if (gameState.king === true) {
  //       playerOnePiece.innerHTML = '<i class="fas fa-crown"></i>';
  //       boardSpaces[i].appendChild(playerOnePiece);
  //     }
  //   }
  //   else if (gameState[i].player === 'p2') {
  //     let playerTwoPiece =  document.createElement('div');
  //     playerTwoPiece.classList.add('game-piece');
  //     playerTwoPiece.classList.add('player-two-piece');
  //     playerTwoPiece.setAttribute('id', 'p2');
  //     boardSpaces[i].appendChild(playerTwoPiece);
  //     if (gameState.king === true) {
  //       playerTwoPiece.innerHTML = '<i class="fas fa-crown"></i>';
  //       boardSpaces[i].appendChild(playerTwoPiece);
  //     }
  //   }
  // }
}