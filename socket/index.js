const socket = (server) => {

    const io = require('socket.io')(server);

    var FIELD_WIDTH = 30;
    var FIELD_HEIGHT = 20;

    var queue = [];    // list of sockets waiting for peers
    var rooms = {};    // map socket.id => room
    var allUsers = {};


    function findPeerForLoneSocket(socket) {

        if (queue.length != 0) {
            // somebody is in queue
            let peer = queue.pop();
            let room = socket.id + '#' + peer.id;
            // join them both
            peer.join(room);
            socket.join(room);
            // register rooms to their names
            rooms[peer.id] = room;
            rooms[socket.id] = room;
            // make initial snake position and start the game
            let rand = makeRandCoord();
            peer.emit('startGame', rand.x, rand.y);
            socket.emit('startGame', rand.x+1, rand.y+2);

        } else {
            queue.push(socket);
        }
    }

    function makeRandCoord() {
        return {
            x: Math.floor(1+Math.random() * (FIELD_WIDTH-1)),
            y: Math.floor(1+Math.random() * (FIELD_HEIGHT-1))
        };
    }

    io.on('connection', function (socket) {
        setTimeout(()=> {
            allUsers[socket.id] = socket;
            findPeerForLoneSocket(socket);

            let rand = makeRandCoord();

            io.emit('nextFood', rand.x, rand.y);
            rand = makeRandCoord();
            io.emit('nextPoison', rand.x, rand.y);


            socket.on('move', function (snake) {
                let room = rooms[socket.id];
                socket.broadcast.to(room).emit('nextMove', snake);
            });

            socket.on('gameOver', function () {
                let room = rooms[socket.id];
                socket.broadcast.to(room).emit('victory');
            });

            socket.on('foodEaten', function () {
                let room = rooms[socket.id];
                let rand = makeRandCoord();
                io.in(room).emit('nextFood', rand.x, rand.y);
                rand = makeRandCoord();
                io.in(room).emit('nextPoison', rand.x, rand.y);
            });

            socket.on('disconnect', function () {
                let room = rooms[socket.id];
                socket.broadcast.to(room).emit('leave', room);
                if (queue.indexOf(socket) == 0) queue.splice(queue.indexOf(socket), 1);
            });
        });

        return io;
        },1000);
};

module.exports = socket;