var path = require('path');

var JSGround = require(path.join(__dirname, 'lib', 'jsground'))
  , jsparser = require(path.join(__dirname, 'lib', 'jsparser'))
  , ground = new JSGround(jsparser);

var express = require('express');
var app = express();
var server = require('http').Server(app);

var io = require('socket.io')(server);
io.on('connection', function (socket) {
  socket.on('blocChanged', function (index, blocContents) {
    ground.blocs[index] = blocContents;
    io.emit('blocsExecuted', ground.execute(index));
  });
});

app.set('view engine', 'jade');

app.use(express.static('bower_components'));
app.use(express.static('public'));

app.get('/', function (req, res) {
  res.render('index');
});

server.listen(3000);
