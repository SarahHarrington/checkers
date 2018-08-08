console.log('javascript loaded');

const socket = io();

//Board Things
const boardSpaces = [...document.querySelectorAll('.playable')];
const capturedPieces = document.querySelector('.captured-pieces');
const gameMessageDisplay = document.querySelector('.game-message');
const startGameButton = document.getElementById('start-game').addEventListener('click', startTheGame);
const currentPlayerDisplay = document.getElementById('current-turn');

let currentTurn = {
  player: null, //currently tracking the piece type for player
  startSpace: null, // the piece the drag start action happened on
  endSpace: null, //The space in the drop
  activePiece: null, //the game piece selected
  isJump: false, //if the move is a jump
  endingJump: false  //notifies that the jump turn is ending
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

socket.on('newClientConnection', (data) => {
  console.log('a new client has connected', data);
});

socket.on('changePlayerTurn', serverTurn => {
  currentTurn.player = serverTurn.player;
  changeTurn(currentTurn.player);
})

socket.on('invalidMove', () => {
  console.log('that move is invalid');
})

// ===================== FUNCTIONS =======================
function dragStartHandler(e) {
  currentTurn.activePiece = e.target;
  currentTurn.startSpace = e.target.parentElement.id;
  // socket.emit('moveStarted', currentTurn);
}

function dragoverHandler(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function dropHandler(e) {
  currentTurn.endSpace = e.target.id;
  e.preventDefault();
  socket.emit('checkIfValidMove', currentTurn);
}

//starts the game when button clicked
function startTheGame() {
  socket.emit('startTheGame');
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
