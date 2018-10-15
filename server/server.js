const express = require('express');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//array of all possible moves
const validMoves = require('./modules/valid_moves.js');
let gameState = require('./modules/game_state.js');

let game = {
  id: null,
  playerOne: null,
  playerTwo: null,
}

let allGames = [];

let currentTurn = {
  player: null, //currently tracking the piece type for player
  startSpace: null, // the piece the drag start action happened on
  endSpace: null, //The space in the drop 
  jumpSpace: null,
  jump: false, //if the move is a jump
  activePiece: null, //the game piece selected
  endingJump: false  //notifies that the jump turn is ending
}

app.use(express.static(`${__dirname}/public`));

io.on('connection', function (socket) {
  io.emit('aNewClientConnection', socket.id);

  console.log('a new client has connected', socket.id);
  console.log('game', game)
  if (game.playerOne === null) {
    game.playerOne = socket.id;
    io.to(socket.id).emit('playerOne');
    console.log(game);
  }
  else if (game.playerTwo === null) {
    game.playerTwo = socket.id;
    io.to(socket.id).emit('playerTwo');
    game.id = allGames.length + 1;
    allGames.push(game);

    game = {
      id: null,
      playerOne: null,
      playerTwo: null,
      gameState: {},
    }
  }

  console.log(allGames);

  //creates random number and determines which player goes first 
  //need to get back the game id and update the gamestate there? 
  socket.on('startTheGame', () => {
    console.log('starting the game', socket.id);
    activeGame = true;
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
    if (socket.id === playerOne || socket.id === playerTwo) {
      console.log(socket.id);
      //sends invalid message back to the client
      if (gameState[clientTurn.endSpace].player !== 0) {
        io.emit('invalidMove');
      }
      //manages movement of kinged pieces
      if (gameState[clientTurn.startSpace].king === true) {
        kingmoves(clientTurn);
      }
      else {
        let possibleMoves = validMoves[clientTurn.startSpace];
        let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
        let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
        let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
        let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

        currentTurn.startSpace = clientTurn.startSpace;
        currentTurn.endSpace = clientTurn.endSpace;

        /*************  PLAYER ONE  *****************/
        if (clientTurn.player === 'p1') {
          if (forward.length > 0) {
            if (clientTurn.endSpace === '29' || clientTurn.endSpace === '30' || clientTurn.endSpace === '31' || clientTurn.endSpace === '32') {
              currentTurn.king = true;
              gameState[currentTurn.endSpace].king = true;
              gameState[clientTurn.startSpace].player = 0;
              gameState[clientTurn.endSpace].player = currentTurn.player;
              endOfTheTurn();
            }
            else {
              gameState[clientTurn.startSpace].player = 0;
              gameState[clientTurn.endSpace].player = currentTurn.player;
              endOfTheTurn();
            }
          }
          if (forwardJump.length > 0) {
            if (clientTurn.endSpace === '29' || clientTurn.endSpace === '30' || clientTurn.endSpace === '31' || clientTurn.endSpace === '32') {
              gameState[clientTurn.endSpace].king = true;
              currentTurn.king = true;
            }
            let jumpToSpaceIndex = possibleMoves.fj.indexOf(parseInt(clientTurn.endSpace)); //ending spot
            let checkingPieceJumped = possibleMoves.f[jumpToSpaceIndex]; //jumped space
            if (gameState[checkingPieceJumped].player === 'p2') {
              currentTurn.jump = true;
              currentTurn.jumpSpace = checkingPieceJumped;
              gameState[clientTurn.startSpace].player = 0;
              gameState[clientTurn.endSpace].player = currentTurn.player;
              gameState[checkingPieceJumped].player = 0;
              let nextPossibleMoves = validMoves[clientTurn.endSpace].fj;
              let possibleJumpedSpaces = validMoves[clientTurn.endSpace].f;
              if (nextPossibleMoves[0] === 0 && nextPossibleMoves[1] === 0) {
                endOfTheTurn();
              }
              else {
                checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces);
              }
            }
            else {
              io.emit('invalidMove');
            }
          }
        }
        if (clientTurn.player === 'p2') {
          if (rear.length > 0) {
            if (currentTurn.endSpace === '1' || currentTurn.endSpace === '2' || currentTurn.endSpace === '3' || currentTurn.endSpace === '4') {
              currentTurn.king = true;
              gameState[currentTurn.endSpace].king = true;
              gameState[clientTurn.startSpace].player = 0;
              gameState[clientTurn.endSpace].player = currentTurn.player;
              endOfTheTurn();
            }
            else {
              gameState[clientTurn.startSpace].player = 0;
              gameState[clientTurn.endSpace].player = currentTurn.player;
              endOfTheTurn();
            }
          }
          if (rearJump.length > 0) {
            if (currentTurn.endSpace === '1' || currentTurn.endSpace === '2' || currentTurn.endSpace === '3' || currentTurn.endSpace === '4') {
              currentTurn.king = true;
              gameState[currentTurn.endSpace].king = true;
            }
            let jumpToSpaceIndex = possibleMoves.rj.indexOf(parseInt(clientTurn.endSpace));
            let checkingPieceJumped = possibleMoves.r[jumpToSpaceIndex];
            if (gameState[checkingPieceJumped].player === 'p1') {
              currentTurn.jump = true;
              currentTurn.jumpSpace = checkingPieceJumped;
              gameState[clientTurn.startSpace].player = 0;
              gameState[clientTurn.endSpace].player = currentTurn.player;
              let nextPossibleMoves = validMoves[clientTurn.endSpace].rj;
              let possibleJumpedSpaces = validMoves[clientTurn.endSpace].r;
              if (nextPossibleMoves[0] === 0 && nextPossibleMoves[1] === 0) {
                endOfTheTurn();
              }
              else {
                checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces);
              }
            }
            else {
              io.emit('invalidMove');
            }
          }
        }
      }
    } else {
      console.log('Cannot go')
    }
  })
})

function kingmoves(clientTurn) {
  let possibleMoves = validMoves[clientTurn.startSpace];
  let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
  let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
  let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
  let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

  currentTurn.startSpace = clientTurn.startSpace;
  currentTurn.endSpace = clientTurn.endSpace;

  let rearJumpToSpaceIndex = possibleMoves.rj.indexOf(parseInt(clientTurn.endSpace));
  let rearCheckingPieceJumped = possibleMoves.r[rearJumpToSpaceIndex];
  let rearNextPossibleMoves = validMoves[clientTurn.endSpace].rj;
  let rearPossibleJumpedSpaces = validMoves[clientTurn.endSpace].r;
  let forwardJumpToSpaceIndex = possibleMoves.fj.indexOf(parseInt(clientTurn.endSpace));
  let forwardCheckingPieceJumped = possibleMoves.f[forwardJumpToSpaceIndex];
  let forwardNextPossibleMoves = validMoves[clientTurn.endSpace].fj;
  let forwardPossibleJumpedSpaces = validMoves[clientTurn.endSpace].f;

  if (forward.length > 0 || rear.length > 0) {
    gameState[clientTurn.startSpace].player = 0;
    gameState[clientTurn.startSpace].king = false;
    gameState[clientTurn.endSpace].player = currentTurn.player;
    gameState[clientTurn.endSpace].king = true;
    endOfTheTurn();
  }
  if (forwardJump.length > 0) {
    checkForKingJumps(clientTurn, forwardCheckingPieceJumped, forwardNextPossibleMoves, forwardPossibleJumpedSpaces);
  }
  if (rearJump.length > 0) {
    checkForKingJumps(clientTurn, rearCheckingPieceJumped, rearNextPossibleMoves, rearPossibleJumpedSpaces);
  }
}

/***************** CHECK FOR ADDITIONAL JUMPS *******************/
function checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces) {
  let leftMove = gameState[nextPossibleMoves[0]].player;
  let rightMove = gameState[nextPossibleMoves[1]].player;
  let leftJumpedSpace = gameState[possibleJumpedSpaces[0]].player;
  let rightJumpedSpace = gameState[possibleJumpedSpaces[1]].player;
  let leftrightstate = ((leftMove === 0) ? 1 : 0) + ((rightMove === 0) ? 2 : 0);
  switch (leftrightstate) {
    case 0:
      //NEITHER ARE VALID
      endOfTheTurn();
      currentTurn.jump = false;
      break;
    case 1:
      //LEFT IS VALID
      if (currentTurn.player === 'p1' && leftJumpedSpace === 'p2') {
        io.emit('updateBoard', currentTurn)
      }
      else if (currentTurn.player === 'p2' && leftJumpedSpace === 'p1') {
        io.emit('updateBoard', currentTurn)
      }
      else {
        endOfTheTurn();
        currentTurn.jump = false;
      }
      break;
    case 2:
      //RIGHT IS VALID MOVE
      if (currentTurn.player === 'p1' && rightJumpedSpace === 'p2') {
        io.emit('updateBoard', currentTurn)
        currentTurn.jump = false;
      }
      else if (currentTurn.player === 'p2' && rightJumpedSpace === 'p1') {
        io.emit('updateBoard', currentTurn);
        currentTurn.jump = false;
      }
      else {
        endOfTheTurn();
        currentTurn.jump = false;
      }
      break;
    case 3:
      //both could be valid;
      if (currentTurn.player === 'p1' && leftJumpedSpace === 'p2' || currentTurn.player === 'p1' && rightJumpedSpace === 'p2') {
        io.emit('updateBoard', currentTurn)
      }
      else if (currentTurn.player === 'p2' && leftJumpedSpace === 'p1' || currentTurn.player === 'p2' && rightJumpedSpace === 'p1') {
        io.emit('updateBoard', currentTurn)
      }
      else {
        endOfTheTurn();
        currentTurn.jump = false;
      }
      break;
    default:
      console.log('switch default');
  }
}

function checkForKingJumps(clientTurn, checkingPieceJumped, nextPossibleMoves, possibleJumpedSpaces) {
  currentTurn.jump = true;
  currentTurn.jumpSpace = checkingPieceJumped;
  //updates the gamestate
  gameState[clientTurn.startSpace].player = 0;
  gameState[clientTurn.startSpace].king = false;
  gameState[clientTurn.endSpace].player = currentTurn.player;
  gameState[clientTurn.endSpace].king = true;
  gameState[checkingPieceJumped].player = 0;

  //check for additional jumps
  if (nextPossibleMoves[0] === 0 && nextPossibleMoves[1] === 0) {
    endOfTheTurn();
  }
  else {
    checkForAdditionalJumps(nextPossibleMoves, possibleJumpedSpaces);
  }
}

function endOfTheTurn() {
  //ADD SOMETHING TO CHECK IF GAME IS DONE FIRST?
  io.emit('endOfTheTurn', currentTurn);
  if (currentTurn.player === 'p1') {
    currentTurn.player = 'p2';
    io.emit('changePlayerTurn', currentTurn);
    currentTurn.jump = false;
    currentTurn.king = false;
  }
  else if (currentTurn.player === 'p2') {
    currentTurn.player = 'p1';
    io.emit('changePlayerTurn', currentTurn);
    currentTurn.jump = false;
    currentTurn.king = false;
  }
}


server.listen(5000);
console.log('listening on server');