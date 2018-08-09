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

    if (gameState[clientTurn.endSpace].player !== 0) {
      console.log(gameState[clientTurn.endSpace]);
      console.log('invalidMove')
      io.emit('invalidMove');
    }
    else {
      console.log('in the else');
      //need to check if the end space is in the list of valid moves
      let possibleMoves = validMoves[clientTurn.startSpace];
      console.log('possibleMoves', possibleMoves);
      //how do I went to define/check the piece type?
      let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
      let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
      let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
      let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

      console.log('the moves', forward, forwardJump, rear, rearJump);
      console.log('clientTurn.player', clientTurn.player);
      if (clientTurn.player === 'p1') {
        if (forward.length > 0) {
          gameState[clientTurn.endSpace].player = currentTurn.player;
          console.log('in the reg play for p1')
          //end the turn
        }
        if (forwardJump.length > 0) {
          //TODO: check if pieces is on jumped space first
          gameState[clientTurn.endSpace].player = currentTurn.player;
          //check for additional jumps
          console.log('in the player 1 jump', validMoves[clientTurn.endSpace]);
          let nextPossibleMoves = validMoves[clientTurn.endSpace].fj;
          let possibleJumpedSpaces = validMoves[clientTurn.endSpace].f;

          //check if jumping again, pass variables to function?
          checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces);

        }
      }
      if (clientTurn.player === 'p2') {
        if (rear.length > 0) {
          gameState[clientTurn.endSpace].player = currentTurn.player;
          //update the space and check for more moves
        }
        if (rearJump.length > 0) {
          gameState[clientTurn.endSpace].player = currentTurn.player;

          let nextPossibleMoves = validMoves[clientTurn.endSpace].fj;
          let possibleJumpedSpaces = validMoves[clientTurn.endSpace].f;
        }
      }
      if (clientTurn.plaeyr === 'king') {
        if (forward.length > 0 || rear.length > 0) {
          //update the sapce and check for more moves
        }
        if (forwardJump.length > 0 || rearJump.length > 0) {

        }
      }
    }
  })
})

function checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces) {
  let leftMove = gameState[nextPossibleMoves[0]].player;
  let rightMove = gameState[nextPossibleMoves[1]].player;
  let leftJumpedSpace = gameState[possibleJumpedSpaces[0]].player;
  let rightJumpedSpace = gameState[possibleJumpedSpaces[1]].player;

  console.log('left and right moves', leftMove, rightMove);
}


server.listen(5000);
console.log('listening on server');