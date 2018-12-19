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

  console.log('joined', socket.id)

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
    //TODO: Add a notice to remaining player that the other person disconnected
  })

  socket.on('keepConnectionAlive', () => {
    console.log('ping from client', socket.id);
  })

  socket.on('startTheGame', () => {
    if (game.playerTwo === null) {
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
      currentGame.currentTurn.player = 'p1';
    }
    if (randomNumber >= 6) {
      currentGame.currentTurn.player = 'p2';
    }
    io.emit('gameStarted', currentGame);
  })

  socket.on('checkIfValidMove', (activeTurn) => {
    console.log('active turn from the client', activeTurn);
    //TODO: Do I want game play to be based on the player turn, make sure the move the
    //move is valid and then check against the game state to ensure the move can be made
    //update gamestate and send back for updating DOM?
    //TODO: check in the valid moves if p1, check forward, of p2 check rear, if king, check both

    
  })
})

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
  console.log(currentGame);
  io.to(currentGame.playerOne).to(currentGame.playerTwo).emit('gameReadyToStart');
}

server.listen(5000);
console.log('listening on server');