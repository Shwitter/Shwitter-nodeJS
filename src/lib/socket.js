const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel")
const jwtDecode = require('jwt-decode');

let users = {};

module.exports = function (io) {
    io.on('connection', function (socket) {
        //Create Users array with all connected user.
        socket.on('new-user', function (data) {
            let jwt = data.jwt;
            let decodedJwt = jwtDecode(jwt);
            let id = decodedJwt.user.id;
            userModel.findById(id).then(function (data) {
                socket.username = data.username;
                // username should be equal to user socket
                // to defined receiver in private messaging.
                users[socket.username] = socket;
            });

        })

        // Send old messages to client.
        socket.on('old-messages', function (data) {
            let receiver = data.receiver;
            let jwt = data.sender;
            let decodedJwt = jwtDecode(jwt);
            let id = decodedJwt.user.id;
            userModel.findById(id).then(function (data) {
                let sender = data.username;
                let roomName = sender.concat('', receiver);
                let roomName2 = receiver.concat('', sender);

                chatModel.find({roomName: roomName}).then(function (doc) {
                    if (doc.length > 0) {
                        users[sender].emit('old-messages', doc);
                    } else {
                        chatModel.find({roomName: roomName2}).then(function (doc) {
                            if (doc.length > 0) {
                                users[sender].emit('old-messages', doc);
                            }
                        })
                    }
                })

            });

        })

        // Send message in real time if user is online.
        // And save in database.
        socket.on('send-message', function (msg) {
            let message = msg.message;
            let receiver = msg.receiver;
            let jwt = msg.sender;
            let decodedJwt = jwtDecode(jwt);
            let id = decodedJwt.user.id;
            userModel.findById(id).then(function (user) {
                let sender = user.username;
                let roomName = sender.concat('', receiver);
                let roomName2 = receiver.concat('', sender);

                //Check if roomName already exists.
                chatModel.find({roomName: roomName}).then(function (doc) {
                    if (doc.length > 0) {
                        sendMessage(roomName);
                    } else {
                        chatModel.find({roomName: roomName2}).then(function (doc) {
                            if (doc.length > 0) {
                                sendMessage(roomName2);
                            }
                            // else create new room
                            else {
                                sendMessage(roomName);
                            }
                        })
                    }
                })

                function sendMessage(roomName) {
                    let newMessage = new chatModel({
                        roomName: roomName,
                        sender: sender,
                        message: message,
                        receiver: receiver,
                    });
                    newMessage.save(function (err) {
                        if (err) throw err;
                        //If receiver is connected (is online), send message.
                        if (receiver in users) {
                            users[receiver].emit('new-message', {message: message, sender: sender});
                        }
                    })
                }

            });


        });




        socket.on("disconnect", function (data) {
            if (!socket.username) return;
            delete users[socket.username];

            console.log("Disconnected")
        })
    });

}


