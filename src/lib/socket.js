const userModel = require("../models/userModel");
const chatModel = require("../models/chatModel")
const notificationModel = require("../models/notificationModel")
const jwtDecode = require('jwt-decode');
const eventEmitter = require("./eventEmitter")

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

        //Send shweet created event to logged in users.
        eventEmitter.on('on-shweet-creat', (subscribers, shweet) => {
            subscribers.forEach((value, key) => {
                if (users[value.username])
                    users[value.username].emit('shweet-created', {shweet: shweet})
            })
        })

        // //Send shweet deleted event to logged in users.
        // eventEmitter.on('shweet deleted', (subscribers, shweetId) => {
        //     // console.log(subscribers, shweetId)
        //     subscribers.forEach((value, key) => {
        //         if (users[value.username])
        //             users[value.username].emit('shweet deleted', { shweetId: shweetId })
        //     })
        // })

        //Send shweet likes changed event to logged in users.
        eventEmitter.on('on-like-change', (subscribers, shweet) => {
            subscribers.forEach((value, key) => {
                if (users[value.username])
                    users[value.username].emit('shweet-likes-changed', { shweet: shweet })
            })
        })

        //Send shweet comments added event to logged in users.
        eventEmitter.on('on-comment-add', (subscribers, comments) => {
            subscribers.forEach((value, key) => {
                if (users[value.username])
                    users[value.username].emit('shweet-comments-added', { comments: comments })
            })
        })

        // //Send shweet comments changed event to logged in users.
        // eventEmitter.on('shweet comments changed', (subscribers, comments) => {
        //     console.log(subscribers, comments)
        //     subscribers.forEach((value, key) => {
        //         if (users[value.username])
        //             users[value.username].emit('shweet comments changed', { comments: comments })
        //     })
        // })

        // //Send shweet comments deleted event to logged in users.
        // eventEmitter.on('shweet comments deleted', (subscribers, comments) => {
        //     console.log(subscribers, comments)
        //     subscribers.forEach((value, key) => {
        //         if (users[value.username])
        //             users[value.username].emit('shweet comments deleted', { comments: comments })
        //     })
        // })

        socket.on('notification-count', function (data) {
            let jwt = data.jwt;
            let decodedJwt = jwtDecode(jwt);
            let id = decodedJwt.user.id;
            notificationModel.find({receiver: id, status: false}).then(function (doc) {
                let length = doc.length;
                userModel.findById(id).then(function (data) {
                    users[data.username].emit('notification-count', {count: length})
                });
            });

        })

        socket.on("disconnect", function (data) {
            if (!socket.username) return;
            delete users[socket.username];

            console.log("Disconnected")
        })
    });

}


