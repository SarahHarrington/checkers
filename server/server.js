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
  state: {},
  currentTurn: {}
}

let allGames = [];

app.use(express.static(`${__dirname}/public`));

io.on('connection', function (socket) {
  io.emit('aNewClientConnection', socket.id);
  console.log('a new client has connected', socket.id);
  console.log('game', game)
  if (game.playerOne === null) {
    game.playerOne = socket.id;
    game.id = socket.id
    io.to(socket.id).emit('playerOne', game.id);
  }
  else if (game.playerTwo === null) {
    game.playerTwo = socket.id;
    game.id = game.id + socket.id;
    io.to(socket.id).emit('playerTwo', game.id);
  }

  socket.on('disconnect', (reason) => {
    console.log('disconnect reasons', reason);
  })

  //creates random number and determines which player goes first 
  socket.on('startTheGame', () => {
    game.state = gameState;
    allGames.push(game);
    game = {
      id: null,
      playerOne: null,
      playerTwo: null,
      gameState: {},
      currentTurn: {}
    }

    let gameIndex = findGame(socket.id);
    let currentGame = allGames[gameIndex];
    let randomNumber = Math.floor(Math.random() * 10) + 1;
    if (randomNumber <= 5) {
      currentGame.currentTurn.player = 'p1';
      io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('changePlayerTurn', currentGame.currentTurn);
    }
    if (randomNumber >= 6) {
      currentGame.currentTurn.player = 'p2';
      io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('changePlayerTurn', currentGame.currentTurn);
    }
  })

  socket.on('checkIfValidMove', (clientTurn) => {
    let gameIndex = findGame(socket.id);
    let currentGame = allGames[gameIndex];
    if (socket.id === currentGame.playerOne || socket.id === currentGame.playerTwo) {
      //sends invalid message back to the client
      if (currentGame.state[clientTurn.endSpace].player !== 0) {
        io.to(socket.id).emit('invalidMove');
      }

      //manages movement of kinged pieces
      if (currentGame.state[clientTurn.startSpace].king === true) {
        kingmoves(gameIndex, clientTurn);
      }

      else {
        let possibleMoves = validMoves[clientTurn.startSpace];
        let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
        let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
        let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
        let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

        currentGame.currentTurn.startSpace = clientTurn.startSpace;
        currentGame.currentTurn.endSpace = clientTurn.endSpace;

        /*************  PLAYER ONE  *****************/
        if (clientTurn.player === 'p1') {
          if (forward.length > 0) {
            if (clientTurn.endSpace === '29' || clientTurn.endSpace === '30' || clientTurn.endSpace === '31' || clientTurn.endSpace === '32') {
              currentGame.currentTurn.king = true;
              currentGame.state[clientTurn.endSpace].king = true;
              currentGame.state[clientTurn.startSpace].player = 0;
              currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
              endOfTheTurn(gameIndex);
            }
            else {
              currentGame.state[clientTurn.startSpace].player = 0;
              currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
              endOfTheTurn(gameIndex);
            }
          }
          if (forwardJump.length > 0) {
            if (clientTurn.endSpace === '29' || clientTurn.endSpace === '30' || clientTurn.endSpace === '31' || clientTurn.endSpace === '32') {
              currentGame.state[clientTurn.endSpace].king = true;
              currentGame.currentTurn.king = true;
            }
            let jumpToSpaceIndex = possibleMoves.fj.indexOf(parseInt(clientTurn.endSpace)); //ending spot
            let checkingPieceJumped = possibleMoves.f[jumpToSpaceIndex]; //jumped space
            if (currentGame.state[checkingPieceJumped].player === 'p2') {
              currentGame.currentTurn.jump = true;
              currentGame.currentTurn.jumpSpace = checkingPieceJumped;
              currentGame.state[clientTurn.startSpace].player = 0;
              currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
              currentGame.state[checkingPieceJumped].player = 0;
              let nextPossibleMoves = validMoves[clientTurn.endSpace].fj;
              let possibleJumpedSpaces = validMoves[clientTurn.endSpace].f;
              if (nextPossibleMoves[0] === 0 && nextPossibleMoves[1] === 0) {
                endOfTheTurn(gameIndex);
              }
              else {
                checkForAdditionalJumps(gameIndex, nextPossibleMoves, possibleJumpedSpaces);
              }
            }
            else {
              io.to(socket.id).emit('invalidMove');
            }
          }
        }
        if (clientTurn.player === 'p2') {
          if (rear.length > 0) {
            if (currentGame.currentTurn.endSpace === '1' || currentGame.currentTurn.endSpace === '2' || currentGame.currentTurn.endSpace === '3' || currentGame.currentTurn.endSpace === '4') {
              currentGame.currentTurn.king = true;
              currentGame.state[clientTurn.endSpace].king = true;
              currentGame.state[clientTurn.startSpace].player = 0;
              currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
              endOfTheTurn(gameIndex);
            }
            else {
              currentGame.state[clientTurn.startSpace].player = 0;
              currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
              endOfTheTurn(gameIndex);
            }
          }
          if (rearJump.length > 0) {
            if (currentGame.currentTurn.endSpace === '1' || currentGame.currentTurn.endSpace === '2' || currentGame.currentTurn.endSpace === '3' || currentGame.currentTurn.endSpace === '4') {
              currentGame.currentTurn.king = true;
              currentGame.state[clientTurn.endSpace].king = true;
            }
            let jumpToSpaceIndex = possibleMoves.rj.indexOf(parseInt(clientTurn.endSpace));
            let checkingPieceJumped = possibleMoves.r[jumpToSpaceIndex];
            if (currentGame.state[checkingPieceJumped].player === 'p1') {
              currentGame.currentTurn.jump = true;
              currentGame.currentTurn.jumpSpace = checkingPieceJumped;
              currentGame.state[clientTurn.startSpace].player = 0;
              currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
              currentGame.state[checkingPieceJumped].player = 0;
              let nextPossibleMoves = validMoves[clientTurn.endSpace].rj;
              let possibleJumpedSpaces = validMoves[clientTurn.endSpace].r;
              if (nextPossibleMoves[0] === 0 && nextPossibleMoves[1] === 0) {
                endOfTheTurn(gameIndex);
              }
              else {
                checkForAdditionalJumps(gameIndex, nextPossibleMoves, possibleJumpedSpaces);
              }
            }
            else {
              io.to(socket.id).emit('invalidMove');
            }
          }
        }
      }
    } else {
      console.log('Cannot go')
    }
  })
})

/*********** FINDS THE GAME **********/
function findGame(socketID) {
  let gameID = allGames.filter(game => game.id.includes(socketID));
  let gameIndex = allGames.findIndex(game => game.id === gameID[0].id);
  return gameIndex;
}

function kingmoves(gameIndex, clientTurn) {
  let possibleMoves = validMoves[clientTurn.startSpace];
  let currentGame = allGames[gameIndex];
  let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
  let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
  let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
  let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

  currentGame.currentTurn.startSpace = clientTurn.startSpace;
  currentGame.currentTurn.endSpace = clientTurn.endSpace;

  let rearJumpToSpaceIndex = possibleMoves.rj.indexOf(parseInt(clientTurn.endSpace));
  let rearCheckingPieceJumped = possibleMoves.r[rearJumpToSpaceIndex];
  let rearNextPossibleMoves = validMoves[clientTurn.endSpace].rj;
  let rearPossibleJumpedSpaces = validMoves[clientTurn.endSpace].r;
  let forwardJumpToSpaceIndex = possibleMoves.fj.indexOf(parseInt(clientTurn.endSpace));
  let forwardCheckingPieceJumped = possibleMoves.f[forwardJumpToSpaceIndex];
  let forwardNextPossibleMoves = validMoves[clientTurn.endSpace].fj;
  let forwardPossibleJumpedSpaces = validMoves[clientTurn.endSpace].f;

  if (forward.length > 0 || rear.length > 0) {
    currentGame.state[clientTurn.startSpace].player = 0;
    currentGame.state[clientTurn.startSpace].king = false;
    currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
    currentGame.state[clientTurn.endSpace].king = true;
    endOfTheTurn(gameIndex);
  }
  if (forwardJump.length > 0) {
    checkForKingJumps(gameIndex, clientTurn, forwardCheckingPieceJumped, forwardNextPossibleMoves, forwardPossibleJumpedSpaces);
  }
  if (rearJump.length > 0) {
    checkForKingJumps(gameIndex, clientTurn, rearCheckingPieceJumped, rearNextPossibleMoves, rearPossibleJumpedSpaces);
  }
}

/***************** CHECK FOR ADDITIONAL JUMPS *******************/
function checkForAdditionalJumps(gameIndex, nextPossibleMoves, possibleJumpedSpaces) {
  let currentGame = allGames[gameIndex];
  let leftMove = allGames[gameIndex].state[nextPossibleMoves[0]].player;
  let rightMove = allGames[gameIndex].state[nextPossibleMoves[1]].player;
  let leftJumpedSpace = allGames[gameIndex].state[possibleJumpedSpaces[0]].player;
  let rightJumpedSpace = allGames[gameIndex].state[possibleJumpedSpaces[1]].player;
  let leftrightstate = ((leftMove === 0) ? 1 : 0) + ((rightMove === 0) ? 2 : 0);
  switch (leftrightstate) {
    case 0:
      //NEITHER ARE VALID
      endOfTheTurn(gameIndex);
      currentGame.currentTurn.jump = false;
      break;
    case 1:
      //LEFT IS VALID
      if (currentGame.currentTurn.player === 'p1' && leftJumpedSpace === 'p2') {
        io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('updateBoard', currentGame.currentTurn)
      }
      else if (currentGame.currentTurn.player === 'p2' && leftJumpedSpace === 'p1') {
        io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('updateBoard', currentGame.currentTurn)
      }
      else {
        endOfTheTurn(gameIndex);
        currentGame.currentTurn.jump = false;
      }
      break;
    case 2:
      //RIGHT IS VALID MOVE
      if (currentGame.currentTurn.player === 'p1' && rightJumpedSpace === 'p2') {
        io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('updateBoard', currentGame.currentTurn)
        currentGame.currentTurn.jump = false;
      }
      else if (currentGame.currentTurn.player === 'p2' && rightJumpedSpace === 'p1') {
        io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('updateBoard', currentGame.currentTurn)
        currentGame.currentTurn.jump = false;
      }
      else {
        endOfTheTurn(gameIndex);
        currentGame.currentTurn.jump = false;
      }
      break;
    case 3:
      //both could be valid;
      if (currentGame.currentTurn.player === 'p1' && leftJumpedSpace === 'p2' || currentGame.currentTurn.player === 'p1' && rightJumpedSpace === 'p2') {
        io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('updateBoard', currentGame.currentTurn)
      }
      else if (currentGame.currentTurn.player === 'p2' && leftJumpedSpace === 'p1' || currentGame.currentTurn.player === 'p2' && rightJumpedSpace === 'p1') {
        io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('updateBoard', currentGame.currentTurn)
      }
      else {
        endOfTheTurn(gameIndex);
        currentGame.currentTurn.jump = false;
      }
      break;
    default:
      console.log('switch default');
  }
}

function checkForKingJumps(gameIndex, clientTurn, checkingPieceJumped, nextPossibleMoves, possibleJumpedSpaces) {
  let currentGame = allGames[gameIndex];
  currentGame.currentTurn.jump = true;
  currentGame.currentTurn.jumpSpace = checkingPieceJumped;
  //updates the gamestate
  currentGame.state[clientTurn.startSpace].player = 0;
  currentGame.state[clientTurn.startSpace].king = false;
  currentGame.state[clientTurn.endSpace].player = currentGame.currentTurn.player;
  currentGame.state[clientTurn.endSpace].king = true;
  currentGame.state[checkingPieceJumped].player = 0;

  //check for additional jumps
  if (nextPossibleMoves[0] === 0 && nextPossibleMoves[1] === 0) {
    endOfTheTurn(gameIndex);
  }
  else {
    checkForAdditionalJumps(gameIndex, nextPossibleMoves, possibleJumpedSpaces);
  }
}

function endOfTheTurn(gameIndex) {
  let currentGame = allGames[gameIndex];
  //ADD SOMETHING TO CHECK IF GAME IS DONE FIRST?
  io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('endOfTheTurn', currentGame.currentTurn);
  if (currentGame.currentTurn.player === 'p1') {
    currentGame.currentTurn.player = 'p2';
    io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('changePlayerTurn', currentGame.currentTurn);
    currentGame.currentTurn.jump = false;
    currentGame.currentTurn.king = false;
  }
  else if (currentGame.currentTurn.player === 'p2') {
    currentGame.currentTurn.player = 'p1';
    io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('changePlayerTurn', currentGame.currentTurn);
    currentGame.currentTurn.jump = false;
    currentGame.currentTurn.king = false;
  }
}

server.listen(5000);
console.log('listening on server');