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
    game.id = socket.id
    io.to(socket.id).emit('playerOne', game.id);
    
  }
  else if (game.playerTwo === null) {
    game.playerTwo = socket.id;
    io.to(socket.id).emit('playerTwo', game.id);

    game.id = game.id + socket.id;
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

    // console.log('the game', gameID)
    activeGame = true;
    console.log('*******the current game', allGames[gameIndex]);
    let randomNumber = Math.floor(Math.random() * 10) + 1;
    if (randomNumber <= 5) {
      allGames[gameIndex].currentTurn.player = 'p1';
      io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('changePlayerTurn', allGames[gameIndex].currentTurn);
    }
    if (randomNumber >= 6) {
      allGames[gameIndex].currentTurn.player = 'p2';
      io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('changePlayerTurn', allGames[gameIndex].currentTurn);
    }
  })

  socket.on('checkIfValidMove', (clientTurn) => {
    let gameIndex = findGame(socket.id);
    if (socket.id === allGames[gameIndex].playerOne || socket.id === allGames[gameIndex].playerTwo) {
      //sends invalid message back to the client
      if (allGames[gameIndex].state[clientTurn.endSpace].player !== 0) {
        console.log('initial invalid')
        io.to(socket.id).emit('invalidMove');
      }

      //manages movement of kinged pieces
      if (allGames[gameIndex].state[clientTurn.startSpace].king === true) {
        kingmoves(gameIndex, clientTurn);
      }

      else {
        let possibleMoves = validMoves[clientTurn.startSpace];
        let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
        let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
        let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
        let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

        allGames[gameIndex].currentTurn.startSpace = clientTurn.startSpace;
        allGames[gameIndex].currentTurn.endSpace = clientTurn.endSpace;

        /*************  PLAYER ONE  *****************/
        if (clientTurn.player === 'p1') {
          if (forward.length > 0) {
            if (clientTurn.endSpace === '29' || clientTurn.endSpace === '30' || clientTurn.endSpace === '31' || clientTurn.endSpace === '32') {
              allGames[gameIndex].currentTurn.king = true;
              allGames[gameIndex].state[clientTurn.endSpace].king = true;
              allGames[gameIndex].state[clientTurn.startSpace].player = 0;
              allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
              endOfTheTurn(gameIndex);
            }
            else {
              allGames[gameIndex].state[clientTurn.startSpace].player = 0;
              allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
              endOfTheTurn(gameIndex);
            }
          }
          if (forwardJump.length > 0) {
            if (clientTurn.endSpace === '29' || clientTurn.endSpace === '30' || clientTurn.endSpace === '31' || clientTurn.endSpace === '32') {
              allGames[gameIndex].state[clientTurn.endSpace].king = true;
              allGames[gameIndex].currentTurn.king = true;
            }
            let jumpToSpaceIndex = possibleMoves.fj.indexOf(parseInt(clientTurn.endSpace)); //ending spot
            let checkingPieceJumped = possibleMoves.f[jumpToSpaceIndex]; //jumped space
            if (allGames[gameIndex].state[checkingPieceJumped].player === 'p2') {
              allGames[gameIndex].currentTurn.jump = true;
              allGames[gameIndex].currentTurn.jumpSpace = checkingPieceJumped;
              allGames[gameIndex].state[clientTurn.startSpace].player = 0;
              allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
              allGames[gameIndex].state[checkingPieceJumped].player = 0;
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
              console.log('p1 invalid')
              io.to(socket.id).emit('invalidMove');
            }
          }
        }
        if (clientTurn.player === 'p2') {
          if (rear.length > 0) {
            if (allGames[gameIndex].currentTurn.endSpace === '1' || allGames[gameIndex].currentTurn.endSpace === '2' || allGames[gameIndex].currentTurn.endSpace === '3' || allGames[gameIndex].currentTurn.endSpace === '4') {
              allGames[gameIndex].currentTurn.king = true;
              allGames[gameIndex].state[clientTurn.endSpace].king = true;
              allGames[gameIndex].state[clientTurn.startSpace].player = 0;
              allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
              endOfTheTurn(gameIndex);
            }
            else {
              allGames[gameIndex].state[clientTurn.startSpace].player = 0;
              allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
              endOfTheTurn(gameIndex);
            }
          }
          if (rearJump.length > 0) {
            if (allGames[gameIndex].currentTurn.endSpace === '1' || allGames[gameIndex].currentTurn.endSpace === '2' || allGames[gameIndex].currentTurn.endSpace === '3' || allGames[gameIndex].currentTurn.endSpace === '4') {
              allGames[gameIndex].currentTurn.king = true;
              allGames[gameIndex].state[clientTurn.endSpace].king = true;
            }
            let jumpToSpaceIndex = possibleMoves.rj.indexOf(parseInt(clientTurn.endSpace));
            let checkingPieceJumped = possibleMoves.r[jumpToSpaceIndex];
            if (allGames[gameIndex].state[checkingPieceJumped].player === 'p1') {
              allGames[gameIndex].currentTurn.jump = true;
              allGames[gameIndex].currentTurn.jumpSpace = checkingPieceJumped;
              allGames[gameIndex].state[clientTurn.startSpace].player = 0;
              allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
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
              console.log('p2 invalid')
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
  console.log('find game id', socketID);
  console.log('gameState', allGames[gameIndex].state);
  return gameIndex;
}

function kingmoves(gameIndex, clientTurn) {
  let possibleMoves = validMoves[clientTurn.startSpace];
  let forward = possibleMoves.f.filter(move => move === parseInt(clientTurn.endSpace));
  let forwardJump = possibleMoves.fj.filter(move => move === parseInt(clientTurn.endSpace));
  let rear = possibleMoves.r.filter(move => move === parseInt(clientTurn.endSpace));
  let rearJump = possibleMoves.rj.filter(move => move === parseInt(clientTurn.endSpace));

  allGames[gameIndex].currentTurn.startSpace = clientTurn.startSpace;
  allGames[gameIndex].currentTurn.endSpace = clientTurn.endSpace;

  let rearJumpToSpaceIndex = possibleMoves.rj.indexOf(parseInt(clientTurn.endSpace));
  let rearCheckingPieceJumped = possibleMoves.r[rearJumpToSpaceIndex];
  let rearNextPossibleMoves = validMoves[clientTurn.endSpace].rj;
  let rearPossibleJumpedSpaces = validMoves[clientTurn.endSpace].r;
  let forwardJumpToSpaceIndex = possibleMoves.fj.indexOf(parseInt(clientTurn.endSpace));
  let forwardCheckingPieceJumped = possibleMoves.f[forwardJumpToSpaceIndex];
  let forwardNextPossibleMoves = validMoves[clientTurn.endSpace].fj;
  let forwardPossibleJumpedSpaces = validMoves[clientTurn.endSpace].f;

  if (forward.length > 0 || rear.length > 0) {
    allGames[gameIndex].state[clientTurn.startSpace].player = 0;
    allGames[gameIndex].state[clientTurn.startSpace].king = false;
    allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
    allGames[gameIndex].state[clientTurn.endSpace].king = true;
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
  let leftMove = allGames[gameIndex].state[nextPossibleMoves[0]].player;
  let rightMove = allGames[gameIndex].state[nextPossibleMoves[1]].player;
  let leftJumpedSpace = allGames[gameIndex].state[possibleJumpedSpaces[0]].player;
  let rightJumpedSpace = allGames[gameIndex].state[possibleJumpedSpaces[1]].player;
  let leftrightstate = ((leftMove === 0) ? 1 : 0) + ((rightMove === 0) ? 2 : 0);
  switch (leftrightstate) {
    case 0:
      //NEITHER ARE VALID
      endOfTheTurn(gameIndex);
      allGames[gameIndex].currentTurn.jump = false;
      break;
    case 1:
      //LEFT IS VALID
      if (allGames[gameIndex].currentTurn.player === 'p1' && leftJumpedSpace === 'p2') {
        io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('updateBoard', allGames[gameIndex].currentTurn)
      }
      else if (allGames[gameIndex].currentTurn.player === 'p2' && leftJumpedSpace === 'p1') {
        io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('updateBoard', allGames[gameIndex].currentTurn)
      }
      else {
        endOfTheTurn(gameIndex);
        allGames[gameIndex].currentTurn.jump = false;
      }
      break;
    case 2:
      //RIGHT IS VALID MOVE
      if (allGames[gameIndex].currentTurn.player === 'p1' && rightJumpedSpace === 'p2') {
        io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('updateBoard', allGames[gameIndex].currentTurn)
        allGames[gameIndex].currentTurn.jump = false;
      }
      else if (allGames[gameIndex].currentTurn.player === 'p2' && rightJumpedSpace === 'p1') {
        io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('updateBoard', allGames[gameIndex].currentTurn)
        allGames[gameIndex].currentTurn.jump = false;
      }
      else {
        endOfTheTurn(gameIndex);
        allGames[gameIndex].currentTurn.jump = false;
      }
      break;
    case 3:
      //both could be valid;
      if (allGames[gameIndex].currentTurn.player === 'p1' && leftJumpedSpace === 'p2' || allGames[gameIndex].currentTurn.player === 'p1' && rightJumpedSpace === 'p2') {
        io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('updateBoard', allGames[gameIndex].currentTurn)
      }
      else if (allGames[gameIndex].currentTurn.player === 'p2' && leftJumpedSpace === 'p1' || allGames[gameIndex].currentTurn.player === 'p2' && rightJumpedSpace === 'p1') {
        io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('updateBoard', currentTurn)
      }
      else {
        endOfTheTurn(gameIndex);
        allGames[gameIndex].currentTurn.jump = false;
      }
      break;
    default:
      console.log('switch default');
  }
}

function checkForKingJumps(gameIndex, clientTurn, checkingPieceJumped, nextPossibleMoves, possibleJumpedSpaces) {
  allGames[gameIndex].currentTurn.jump = true;
  allGames[gameIndex].currentTurn.jumpSpace = checkingPieceJumped;
  //updates the gamestate
  allGames[gameIndex].state[clientTurn.startSpace].player = 0;
  allGames[gameIndex].state[clientTurn.startSpace].king = false;
  allGames[gameIndex].state[clientTurn.endSpace].player = allGames[gameIndex].currentTurn.player;
  allGames[gameIndex].state[clientTurn.endSpace].king = true;
  allGames[gameIndex].state[checkingPieceJumped].player = 0;

  //check for additional jumps
  if (nextPossibleMoves[0] === 0 && nextPossibleMoves[1] === 0) {
    endOfTheTurn(gameIndex);
  }
  else {
    checkForAdditionalJumps(gameIndex, nextPossibleMoves, possibleJumpedSpaces);
  }
}

function endOfTheTurn(gameIndex) {
  //ADD SOMETHING TO CHECK IF GAME IS DONE FIRST?
  io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('endOfTheTurn', allGames[gameIndex].currentTurn);
  if (allGames[gameIndex].currentTurn.player === 'p1') {
    allGames[gameIndex].currentTurn.player = 'p2';
    io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('changePlayerTurn', allGames[gameIndex].currentTurn);
    allGames[gameIndex].currentTurn.jump = false;
    allGames[gameIndex].currentTurn.king = false;
  }
  else if (allGames[gameIndex].currentTurn.player === 'p2') {
    allGames[gameIndex].currentTurn.player = 'p1';
    io.to(allGames[gameIndex].playerOne).to(allGames[gameIndex].playerTwo).emit('changePlayerTurn', allGames[gameIndex].currentTurn);
    allGames[gameIndex].currentTurn.jump = false;
    allGames[gameIndex].currentTurn.king = false;
  }
}


server.listen(5000);
console.log('listening on server');