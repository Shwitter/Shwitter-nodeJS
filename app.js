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
const notificationRouter = require("./src/routes/notification");

const http = require('http').createServer(app);
const io = require('socket.io')(http, { origins: '*:*'});
require('./src/lib/socket')(io);

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

//Routers.
app.use('/user', userRouter);
app.use(shweetRouter);
app.use('/comment', commentRouter);
app.use('/notification', notificationRouter);

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







