if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const {log, ExpressAPILogMiddleware} = require('@rama41222/node-logger');

const app = express();
const userRouter = require("./src/routes/user");

// const chatRouter = require("./src/routes/chat");
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const userModel = require("./src/models/userModel");
const chatModel = require("./src/models/chatModel")
let jwtDecode = require('jwt-decode');
const events = require('events');

const config = {
    name: 'shwitter',
    port: 3000,
    host: '0.0.0.0',
};
const logger = log({console: true, file: false, label: config.name});

app.use(bodyParser.json());
app.use(cors());
app.use(ExpressAPILogMiddleware(logger, {request: true}));


//TODO::dont commit this line.
app.options('*', cors());

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
    socket.on('new-user', async function (data) {
        let jwt = data.jwt;
        let decodedJwt = jwtDecode(jwt);
        let id = decodedJwt.user.id;
        let userInfo = await userModel.findById(id);
        socket.username = userInfo.username;
        //username should be equal to user socket
        //to defined receiver in private messaging.
        users[socket.username] = socket;
    })

    socket.on('old-messages', async function (data) {
        //TODO:: es 6 xazi calke funqciashi gaitane, bevrgan iyeneb da prosta msg achame argmunetad.
        let receiver = msg.receiver;
        let jwt = msg.sender;
        let decodedJwt = jwtDecode(jwt);
        let id = decodedJwt.user.id;
        let senderInfo = await userModel.findById(id);
        let sender = senderInfo.username;

        let old_conversation = userModel.find({sender: sender, receiver: receiver}, function (err, doc) {
            if (err) throw err;
            if (doc) {
                //TODO:: console.log(doc)
                //TODO:: dasorte createdis mixedvit.
                socket.emit('old messages', {doc});
            } else {
                old_conversation = userModel.find({sender: receiver, receiver: sender}, function (err, doc) {
                    if (err) throw err;
                    if (doc) {
                        socket.emit('old messages', {doc});
                    }
                });
            }
        });
    })



    socket.on('send-message', async function (msg) {
        let message = msg.message;
        let receiver = msg.receiver;
        let jwt = msg.sender;
        let decodedJwt = jwtDecode(jwt);
        let id = decodedJwt.user.id;
        let senderInfo = await userModel.findById(id);
        let sender = senderInfo.username;
        let roomName = sender + receiver;

        //Test rooms
        let room = await chatModel.find({roomName: roomName}, function (err, doc) {
            if (err) throw err;
            if (doc) {
                console.log(doc);
            }

        })

        //If receiver is connected.
        let old_conversation = await chatModel.find({sender: sender, receiver: receiver}, function (err, doc) {
            if (err) throw err;
            //If chat history already exist, use old roomName
            if (doc) {
                let newMessage = new chatModel({
                    roomName: doc.roomName,
                    sender: sender,
                    message: message,
                    receiver: receiver
                });
                newMessage.save(function (err) {
                    if (err) throw err;
                    //If receiver is connected (is online), send message.
                    if (receiver in users) {
                        users[receiver].emit('new-message', {message: message, sender: sender});
                    }
                })
            }

            else {
                old_conversation = userModel.find({sender: receiver, receiver: sender}, function (err, doc) {
                    if (err) throw err;
                    if (doc) {
                        let newMessage = new chatModel({
                            roomName: doc.roomName,
                            sender: sender,
                            message: message,
                            receiver: receiver
                        });
                        newMessage.save(function (err) {
                            if (err) throw err;
                            //If receiver is connected (is online), send message.
                            if (receiver in users) {
                                users[receiver].emit('new-message', {message: message, sender: sender});
                            }
                        })

                    }
                    else {
                        let newMessage = new chatModel({
                            roomName: roomName,
                            sender: sender,
                            message: message,
                            receiver: receiver
                        });
                        newMessage.save(function (err) {
                            if (err) throw err;
                            users[receiver].emit('new-message', {message: message, sender: sender});
                        })

                    }
                });



            }

        });


        // let newMessage = new chatModel({sender: socket.nickname, message: message, receiver: receiver});
        // newMessage.save(function (err) {
        //     if(err) throw err;
        //     io.emit('old messages', {message: message, username: socket.nickname});
        // })


    });


    socket.on("disconnect", function (data) {
        if (!socket.username) return;
        delete users[socket.username];

        console.log("Disconnected")
    })
});

//Routers.
app.use('/user', userRouter);
// app.use('/messages', chatRouter);

app.get('/', function (req, res) {
    res.send('Shwitter api is working!')
    res.sendFile(__dirname + '/index.html')
})

http.listen(config.port, config.host, (e) => {
    if (e) {
        throw new Error('Internal Server Error');
    }
    logger.info(`${config.name} running on ${config.host}:${config.port}`);
});

module.exports = app;







