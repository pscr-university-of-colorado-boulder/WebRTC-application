//requires
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

const port = process.env.PORT || 3000;

// express routing
app.use(express.static('public'));


// signaling
io.on('connection', function (socket) {
    console.log('a user connected');

    socket.on('create or join', function (room) {
        console.log(' server : created a room', room);
        
        var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
        var numClients = myRoom.length;

        console.log('sandy: server:', room, ' has ', numClients+1, ' clients');

        if (numClients == 0) {
	    console.log("sandy server: your are first client so create room and joing it");
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients == 1) {
            socket.join(room);
            socket.emit('joined', room);
        } else {
            socket.emit('full', room);
        }
    });

    socket.on('ready', function (room){
        socket.broadcast.to(room).emit('ready');
    });

    socket.on('candidate', function (event){
        socket.broadcast.to(event.room).emit('candidate', event);
    });

    socket.on('offer', function(event){
        socket.broadcast.to(event.room).emit('offer',event.sdp);
    });

    socket.on('answer', function(event){
        socket.broadcast.to(event.room).emit('answer',event.sdp);
    });

});

// listener
http.listen(port || 3000, function () {
    console.log('listening on', port);
});
