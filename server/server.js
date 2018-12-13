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
  state: [],
  currentTurn: {},
  chatLog: [],
  turnCount: null,
}

let allGames = [];

app.use(express.static(`${__dirname}/public`));

io.on('connection', function (socket) {
  io.emit('aNewClientConnection', socket.id);

  console.log('joined', socket.id)

  socket.on('disconnect', () => {
    console.log('disconnected', socket.id);
  })
})


server.listen(5000);
console.log('listening on server');