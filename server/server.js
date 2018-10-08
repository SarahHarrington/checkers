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
  endSpace: null, //The space in the drop 
  jumpSpace: null,
  jump: false, //if the move is a jump
  activePiece: null, //the game piece selected
  endingJump: false  //notifies that the jump turn is ending
}

//TODO: What to do about a piece picked up and put back on starting space?

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

    gameState.forEach(state => {
      state.player = 0;
    })

    for (let i = 1; i <= 12; i++) {
      gameState[i].player = 'p1';
    }
    for (let i = 21; i <= 32; i++) {
      gameState[i].player = 'p2';
    }
    console.log(gameState)
  })


  socket.on('checkIfValidMove', clientTurn => {
    console.log('checkIfValidMove', clientTurn);
    console.log('end space', gameState[clientTurn.endSpace]);
    if (gameState[clientTurn.endSpace].player !== 0) {
      console.log('initial invalid')
      io.emit('invalidMove');
    }
    else {
      console.log('gameState', gameState);
      let possibleMoves = validMoves[clientTurn.startSpace];
      let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
      let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
      let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
      let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

      currentTurn.startSpace = clientTurn.startSpace;
      currentTurn.endSpace = clientTurn.endSpace;
      
      /*************  PLAYER ONE  *****************/
      if (clientTurn.player === 'p1') {
        console.log('p1')
        if (forward.length > 0) {
          gameState[clientTurn.startSpace].player = 0;
          gameState[clientTurn.endSpace].player = currentTurn.player;
          endOfTheTurn();
        }
        if (forwardJump.length > 0) {
          let jumpToSpaceIndex = possibleMoves.fj.indexOf(parseInt(clientTurn.endSpace));
          let checkingPieceJumped = possibleMoves.f[jumpToSpaceIndex];
          console.log('checkingPieceJumped', checkingPieceJumped);

          if (gameState[checkingPieceJumped].player === 'p2') {
            currentTurn.jump = true;
            currentTurn.jumpSpace = checkingPieceJumped;

            //TODO: emit back move the piece
            
            gameState[clientTurn.startSpace].player = 0;
            gameState[clientTurn.endSpace].player = currentTurn.player;
            //check for additional jumps
            console.log('in the player 1 jump', validMoves[clientTurn.endSpace]);
            let nextPossibleMoves = validMoves[clientTurn.endSpace].fj;
            let possibleJumpedSpaces = validMoves[clientTurn.endSpace].f;
            
            //check if jumping again, pass variables to function?
            checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces);
          }
          else {
            console.log('p1 invalid')
            io.emit('invalidMove');
          }
        }
      }
      if (clientTurn.player === 'p2') {
        console.log('p2')
        if (rear.length > 0) {
          gameState[clientTurn.startSpace].player = 0;
          gameState[clientTurn.endSpace].player = currentTurn.player;
          // io.emit('endOfTheTurn', currentTurn);
          endOfTheTurn();
        }
        if (rearJump.length > 0) {
          let jumpToSpaceIndex = possibleMoves.rj.indexOf(parseInt(clientTurn.endSpace));
          let checkingPieceJumped = possibleMoves.r[jumpToSpaceIndex];
          console.log('checkingPieceJumped', checkingPieceJumped);

          if (gameState[checkingPieceJumped].player === 'p1') {
            currentTurn.jump = true;
            currentTurn.jumpSpace = checkingPieceJumped;

            gameState[clientTurn.startSpace].player = 0;
            gameState[clientTurn.endSpace].player = currentTurn.player;
            //TODO: emit back move the piece
            
            //check for additional jumps
            console.log('in the player 2 jump', validMoves[clientTurn.endSpace]);
            let nextPossibleMoves = validMoves[clientTurn.endSpace].rj;
            let possibleJumpedSpaces = validMoves[clientTurn.endSpace].r;
            
            //check if jumping again, pass variables to function?
            checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces);
          }
          else {
            console.log('p2 invalid')
            io.emit('invalidMove');
          }
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
  console.log('jumped piece', leftJumpedSpace, rightJumpedSpace);
  //TODO: How will I prevent them from doing a single space move?

  if (leftMove === 0) {
    console.log('leftMove if')
    if (currentTurn.player === 'p1' && leftJumpedSpace === 'p2') {
      //let game play continue
      console.log('left if')
      io.emit('updateBoard', currentTurn)
    }
    else if (currentTurn.player === 'p2' && leftJumpedSpace === 'p1') {
      //let game play continue
      console.log('left else if')
      io.emit('updateBoard', currentTurn)

    }
    else {
      //end the turn
      console.log('left else for end the turn')
      endOfTheTurn();
      currentTurn.jump = false;

    }
  }
  else if (rightMove === 0) {
    console.log('rightMove if')
    if (currentTurn.player === 'p1' && rightJumpedSpace === 'p2') {
      //let game play continue
      console.log('right if')
      io.emit('updateBoard', currentTurn)

    }
    else if (currentTurn.player === 'p2' && rightJumpedSpace === 'p1') {
      //let game play continue
      console.log('right else if')
      io.emit('updateBoard', currentTurn)

    }
    else {
      //end the turn
      console.log('right end the turn else')
      endOfTheTurn();
      currentTurn.jump = false;

    }
  }
  else {
    //end the turn
    console.log('in the end turn else')
    endOfTheTurn();
    currentTurn.jump = false;
  }
}

function endOfTheTurn() {
  io.emit('endOfTheTurn', currentTurn);
  if (currentTurn.player === 'p1') {
    console.log('changed to player 2')
    console.log(gameState)
    currentTurn.player = 'p2';
    io.emit('changePlayerTurn', currentTurn);

  }
  else if (currentTurn.player === 'p2') {
    console.log('changed to player 1')
    console.log(gameState)
    currentTurn.player = 'p1';
    io.emit('changePlayerTurn', currentTurn);
  }
}


server.listen(5000);
console.log('listening on server');