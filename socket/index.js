var socket = (server) => {

    var io = require('socket.io')(server);

    var FIELD_WIDTH = 30;
    var FIELD_HEIGHT = 20;

    var queue = [];    // list of sockets waiting for peers
    var rooms = {};    // map socket.id => room
    var allUsers = {};


    var findPeerForLoneSocket = function (socket) {

        if (queue.length != 0) {
            // somebody is in queue
            var peer = queue.pop();
            var room = socket.id + '#' + peer.id;
            // join them both
            peer.join(room);
            socket.join(room);
            // register rooms to their names
            rooms[peer.id] = room;
            rooms[socket.id] = room;
            //  start the game
            peer.emit('startGame');
            socket.emit('startGame');

        } else {
            queue.push(socket);
        }
    }

    var makeRandCoord = function () {
        return {
            x: Math.floor(Math.random() * ((FIELD_WIDTH - 1) - 0)),
            y: Math.floor(Math.random() * ((FIELD_HEIGHT - 1) - 0))
        };
    }

    io.on('connection', function (socket) {

        allUsers[socket.id] = socket;
        findPeerForLoneSocket(socket);

        var rand = makeRandCoord();

        io.emit('nextFood', rand.x, rand.y);
        rand = makeRandCoord();
        io.emit('nextPoison', rand.x, rand.y);


        socket.on('move', function (snake) {

            var room = rooms[socket.id];
            socket.broadcast.to(room).emit('nextMove', snake);

        });

        socket.on('gameOver', function () {
            var room = rooms[socket.id];
            socket.broadcast.to(room).emit('victory');
        });

        socket.on('foodEaten', function () {
            var room = rooms[socket.id];
            var rand = makeRandCoord();
            io.in(room).emit('nextFood', rand.x, rand.y);
            rand = makeRandCoord();
            io.in(room).emit('nextPoison', rand.x, rand.y);
        });

        socket.on('disconnect', function () {
            var room = rooms[socket.id];
            socket.broadcast.to(room).emit('leave', room);
            if (queue.indexOf(socket) == 0) queue.splice(queue.indexOf(socket), 1);
        });
    });

    return io;

};

module.exports = socket;