
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
    playerCrash = {1: "", 2:"", 3:"" };

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
    //socket.emit('foo', { hello: 'world' });
    socket.on('crash', function (data) {
    	var lastCrash = playerCrash[data.player];
    	var nextBlinkTime = lastCrash + 30;
    	var now = +new Date().now();
    	if (now > nextBlinkTime) {
    		hitPlayer(data.player)
    		playerCrash[data.player] = now;
    	};
        console.log("Crashed!!", data);
    });
    socket.on('newPlayer', function (data) {
        socket.broadcast.emit('newPlayer', { "player": data.player});
    });
    var iteration = 0;
    socket.on('position', function (data) {
        socket.broadcast.emit('position', { "player": data.player, "pos": data.pos});
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
	playerCrash[id] = +new Date();
	console.log("playerCrash "+id +" crash init: "+playerCrash[id]);
    var newstate = lightState.create().on().hsl(playerColors[id],100, 0);
    setLight(id, newstate);
    setLight(id, lightState.create().off());
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
	var run = function() {//sets yellow color
		var blink = lightState.create().on().alert(false).off();

				console.log("blink");
		return setGroupLight(1, blink)
			   .then(function () {
					console.log("blink");
					return setGroupLight(1, blink); })
			   .then(function() { 
					console.log("blink");
					return setGroupLight(1, blink); })
			    .fail(displayError);
	}
	return api.getGroup(1).then(function (group) {
		console.log("group", group);
		if (group.LastAction && group.LastAction.on) {
			console.log('lights are on, turning off')
			return setGroupLight(1, lightState.create().off()).then(run);
		} else
			return run();
	});	
}
var resetGame = function() {
		var yellow = lightState.create().on().hsl(120,100, 0);
		return setGroupLight(1, yellow).then(function() { return setGroupLight(1, lightState.create().off()); });
}

function setLight(id, state) {
    return api.setLightState(id, state)
    .then(displayResult)
    .fail(displayError)
    .done();
}

function setGroupLight(id, state) {
	return api.setGroupLightState(id, state);
}

resetGame()
.then(function() {
	console.log("finished reset");
	return startGame();
})
.then(function() {
	console.log("init player");
	intializePlayer(1);
	intializePlayer(2);
	intializePlayer(3);
});

