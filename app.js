if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {log, ExpressAPILogMiddleware} = require('@rama41222/node-logger');

const app = express();
const userRouter = require("./src/routes/user");
const shweetRouter = require("./src/routes/shweet");
const commentRouter = require("./src/routes/comment");

// const chatRouter = require("./src/routes/chat");
const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});
const userModel = require("./src/models/userModel");
const chatModel = require("./src/models/chatModel")
let jwtDecode = require('jwt-decode');

const config = {
    name: 'shwitter',
    port: process.env.SERVER_PORT,
    host: process.env.SERVER_HOST,
};
const logger = log({console: true, file: false, label: config.name});

app.use(bodyParser.json());
app.use(cors());
app.use('/public', express.static('public'))
app.use(ExpressAPILogMiddleware(logger, { request: true }));

app.use(express.static(__dirname));

//db connection.
const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
})
mongoose.set('useCreateIndex', true);
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

let users = {};


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
                }
                else {
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
                }
                else {
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

            function sendMessage(roomName){
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

//Routers.
app.use('/user', userRouter);
app.use(shweetRouter);
app.use('/comment', commentRouter);

app.get('/', function (req, res) {
    res.send('Shwitter api is working!')
})

http.listen(config.port, config.host, (e) => {
    if (e) {
        throw new Error('Internal Server Error');
    }
    logger.info(`${config.name} running on ${config.host}:${config.port}`);
});

module.exports = app;







