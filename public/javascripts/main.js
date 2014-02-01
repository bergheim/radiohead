var rh = rh || {};

var iW = window.innerWidth;
var iH = window.innerHeight;
rh.canvas= document.getElementById("myCanvas");
rh.cnv = rh.canvas.getContext("2d");
rh.cnv.canvas.width = iW;
rh.cnv.canvas.height = iH-40;

function Player() {
    this.pos = {x: 0, y: 0, z: 0};

    this.init = function() {
        this.img = new Image();
        this.img.src = "images/player.png";
        this.pos.x = (iW-this.img.width)/2;
        this.pos.y = (iH-this.img.height)/2;
        this.img.onload = (function(that) {
            return function() {
                rh.cnv.drawImage(that.img, that.pos.x, that.pos.y);
            }
        })(this);
    }

    this.update = function(x, y) {
        this.pos.x = x;
        this.pos.y = y;
    }

    this.render = function() {
        rh.cnv.drawImage(this.img, this.pos.x, this.pos.y);
    }
}

var players = {}

function render() {
    rh.cnv.clearRect(0, 0, rh.canvas.width, rh.canvas.height);
    //for (var i = 0, len = players.length; i < len; i++) {
    //    players[i].render();
    //}
    for (var p in players) {
        players[p].render();
    }
}

var socket = io.connect('http://localhost:8080');
socket.on('position', function (data) {
    if (players.hasOwnProperty(data.player)) {
        players[data.player].update(data.pos[0], data.pos[1]);
        render();
    }
});
socket.on('getPlayers', function (data) {
});

socket.on('newPlayer', function (data) {
    var p = new Player();
    p.init();
    players[data.player] = p;
});

socket.on('foo', function (data) {
    console.log(data);
});
