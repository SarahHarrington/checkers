const express = require('express');
const app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//array of all possible moves
const validMoves = require('./modules/valid_moves.js');
const gameState = require('./modules/game_state.js');

let game = {
  id: null,
  playerOne: null,
  playerTwo: null,
  state: [],
  currentTurn: {},
  chatLog: [],
  turnCount: null,
}

let activeGames = [];

app.use(express.static(`${__dirname}/public`));

io.on('connection', function (socket) {
  io.emit('aNewClientConnection', socket.id);
  if (game.playerOne === null) {
    game.playerOne = socket.id
    game.id = socket.id;
    io.to(socket.id).emit('playerDeclare', { player: 'p1' });
  } else {
    game.playerTwo = socket.id
    game.id = game.id + socket.id;
    game.state = gameState;
    activeGames.push(game);
    io.to(socket.id).emit('playerDeclare', { player: 'p2' });
    game = {
      id: null,
      playerOne: null,
      playerTwo: null,
      state: [],
      currentTurn: {},
      chatLog: [],
      turnCount: null,
    }
    readyToStartGame(socket.id);
  }

  // console.log('joined', socket.id)

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
    //TODO: Add a notice to remaining player that the other person disconnected
  })

  socket.on('keepConnectionAlive', () => {
    console.log('ping from client', socket.id);
  })

  socket.on('startTheGame', () => {
    if (game.playerOne != null && game.playerTwo === null) {
      game.playerTwo = socket.id
      game.state = gameState;
      activeGames.push(game);
      io.to(socket.id).emit('playerDeclare', { player: 'p2' });
      game = {
        id: null,
        playerOne: null,
        playerTwo: null,
        state: [],
        currentTurn: {},
        chatLog: [],
        turnCount: null,
      }
    }
    let gameIndex = findGame(socket.id);
    let currentGame = activeGames[gameIndex];
    let randomNumber = Math.floor(Math.random() * 10) + 1;
    if (randomNumber <= 5) {
      currentGame.currentTurn.player = 1;
    }
    if (randomNumber >= 6) {
      currentGame.currentTurn.player = 2;
    }
    io.emit('gameStarted', currentGame);
  })

  socket.on('checkIfValidMove', (activeTurn) => {

    let gameIndex = findGame(socket.id);
    let currentGame = activeGames[gameIndex];

    checkIfValidPlayer(currentGame, activeTurn, socket.id)
  })

})

function checkIfValidPlayer(currentGame, activeTurn, socketId) {
  
  if (currentGame.state[activeTurn.startSpace - 1].player === currentGame.currentTurn.player && socketId === currentGame.playerOne) {
    console.log('player one is going')
    checktheMoveType(currentGame, activeTurn)
  } else if (currentGame.state[activeTurn.startSpace - 1].player === currentGame.currentTurn.player && socketId === currentGame.playerTwo) {
    console.log('player two is going')
    checktheMoveType(currentGame, activeTurn)
  } else {
    console.log('it is not your turn')
    //TODO: add an emit
  }
}

function checktheMoveType(currentGame, activeTurn) {
  let validTurnMoves = validMoves[parseInt(activeTurn.startSpace)];

  // console.log('validTurnMoves', validTurnMoves)
  let forward = validTurnMoves.f.filter(space => space === activeTurn.endSpace).length;
  let rear = validTurnMoves.r.filter(space => space === activeTurn.endSpace).length;
  let forwardJump = validTurnMoves.fj.filter(space => space === activeTurn.endSpace).length;
  let rearJump = validTurnMoves.rj.filter(space => space === activeTurn.endSpace).length;

  let directions = [forward, rear, forwardJump, rearJump];
  let direction = directions.indexOf(1); // index of will indicate the direction the piece is going


  if (currentGame.state[activeTurn.startSpace].king === true) {
    console.log('this is a king piece!')
    //TODO: Make a seperate king function?
  } else if (direction <= 1) {
    console.log('single move');
    singleSpaceMove(currentGame, activeTurn)
  } else if (direction >= 2) {
    jumpSpaceMove(currentGame, activeTurn)
  }


}

function singleSpaceMove(currentGame, activeTurn) {
  if (currentGame.state[activeTurn.endSpace].player === 0) {
    currentGame.state[activeTurn.startSpace - 1].player = 0;
    currentGame.state[activeTurn.endSpace - 1].player = parseInt(activeTurn.player);
    if (currentGame.currentTurn.player === 1) {
      currentGame.currentTurn.player = 2;
    } else {
      currentGame.currentTurn.player = 1;
    }
    console.log(activeTurn);
    console.log('the single move turn is done')
    //TODO: add an emitter here to update the board
    console.log('updated game state', currentGame.state)
    io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('turnComplete', currentGame);
  }
}

function findGame(socketID) {
  let gameID = activeGames.filter(game => game.id.includes(socketID));
  if (gameID.length === 0) {
    return -1;
  }
  else {
    let gameIndex = activeGames.findIndex(game => game.id === gameID[0].id);
    return gameIndex;
  }
}

function readyToStartGame(socketId) {
  let gameIndex = findGame(socketId);
  let currentGame = activeGames[gameIndex];
  // console.log(currentGame);
  io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('gameReadyToStart');
}

server.listen(5000);
console.log('listening on server');