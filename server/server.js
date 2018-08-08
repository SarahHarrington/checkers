const express = require('express');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//array of all possible moves
const validMoves = require('./modules/valid_moves.js');
let gameState = require('./modules/game_state.js');

let playerOne = null;
let playerTwo = null;

let playerQueue = [];

let currentTurn = {
  player: null, //currently tracking the piece type for player
  startSpace: null, // the piece the drag start action happened on
  jump: false, //if the move is a jump
  endSpace: null, //The space in the drop 
  activePiece: null, //the game piece selected
  endingJump: false  //notifies that the jump turn is ending
}

app.use(express.static(`${__dirname}/public`));

io.on('connection', function (socket) {
  console.log('a new client has connected', socket.id);
  if (playerOne === null) {
    playerOne = socket.id;
  }
  else if (playerTwo === null) {
    playerTwo = socket.id;
  }
  else {
    playerQueue.push({ id: socket.id });
  }

  //creates random number and determines which player goes first  
  socket.on('startTheGame', () => {
    let randomNumber = Math.floor(Math.random() * 10) + 1;
    if (randomNumber <= 5) {
      currentTurn.player = 'p1';
      io.emit('changePlayerTurn', currentTurn);
    }
    if (randomNumber >= 6) {
      currentTurn.player = 'p2';
      io.emit('changePlayerTurn', currentTurn);
    }

    for (let i = 0; i <= 11; i++) {
      gameState[i].player = 'p1';
    }
    for (let i = 20; i <= 31; i++) {
      gameState[i].player - 'p2';
    }

  })

  socket.on('checkIfValidMove', clientTurn => {
    console.log('clientTurn', clientTurn)
    console.log(validMoves[clientTurn.startSpace]);

    if (gameState[clientTurn.endSpace] !== 0) {
      console.log('invalidMove')
      io.emit('invalidMove');
    }
    else {
      console.log('in the else');
      //need to check if the end space is in the list of valid moves
      console.log(validMoves[clientTurn.startSpace]);
      let possibleMoves = validMoves[clientTurn.startSpace];

      //how do I went to define/check the piece type?

      if (clientTurn.player === 'p1') {
        possibleMoves.f;
        possibleMoves.fj;
      }
      if (clientTurn.player === 'p2') {
        possibleMoves.r;
        possibleMoves.rj;
      }
      if (clientTurn.plaeyr === 'king') {
        possibleMoves;
      }
    }

  })


})


server.listen(5000);
console.log('listening on server');