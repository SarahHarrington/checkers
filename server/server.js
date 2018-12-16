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
    io.to(socket.id).emit('playerDeclare', {player: 'p1'});
  } else {
    game.playerTwo = socket.id
    game.id = game.id + socket.id;
    game.state = gameState;
    activeGames.push(game);
    // console.log('game', game);
    // console.log('activeGames', activeGames);
    io.emit('gameStarted', activeGames[0]);
    io.to(socket.id).emit('playerDeclare', {player: 'p2'});
    [game.playerOne, game.playerTwo, game.state] = [null, null, []]
  }

  console.log('joined', socket.id)

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
  })

  socket.on('keepConnectionAlive', () => {
    console.log('ping from client', socket.id);
  })
})


server.listen(5000);
console.log('listening on server');