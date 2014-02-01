
/**
 * Module dependencies.
 */

var express = require('express')
    ,routes = require('./routes')
    ,user = require('./routes/user')
    ,http = require('http')
    ,path = require('path');

var hue = require("node-hue-api"),
    HueApi = hue.HueApi,
    lightState = hue.lightState,
    host = "192.168.1.47",
    username = "newdeveloper",
    api = new HueApi(host, username),
    playerColors = {1:0, 2:130, 3:250};

var app = express();

app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

var io = require('socket.io').listen(8080);
io.sockets.on('connection', function (socket) {
    console.log("connection");
    socket.emit('foo', { hello: 'world' });
    socket.on('crash', function (data) {
        console.log("Crashed!!", data);
    });
    var iteration = 0;
    socket.on('position', function (data) {
        socket.broadcast.emit('position', { "player": '1', "pos": data.pos});
    });
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/user', user.list);
app.get('/overview', function(req, res) {
    res.render('overview', { title: 'Radiohead' });
});

app.post('/login', function(req, res) {
    console.log("test");

    res.render('index', { title: 'Express' });
});

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

var displayResult = function(result) {
    console.log(result);
};
var displayError = function(err) {
    console.error(err);
};
var intializePlayer = function(id) {
    var newstate = lightState.create().on().hsl(playerColors[id],100, 0);
    setLight(id, newstate);
};
var terminatePlayer = function(id) {
    var newstate = lightState.create().off();
    setLight(id, newstate);
};
var hitPlayer = function(id) {
    var newstate = lightState.create().alert(false).off();
    setLight(id, newstate);
};
var startGame = function() {
	var newstate = "";
}

function setLight(id, state) {
    api.setLightState(id, state)
    .then(displayResult)
    .fail(displayError)
    .done();
}


