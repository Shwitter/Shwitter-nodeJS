const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { log, ExpressAPILogMiddleware } = require('@rama41222/node-logger');

const app = express();
const bootstrap = require("./src/routes/index");

const config = {
    name: 'shwitter',
    port: 4200,
    host: '0.0.0.0',
};
const logger = log({ console: true, file: false, label: config.name });

//Create Express Router

app.use('/user', bootstrap);
// console.log(bootstrap)

// bootstrap(app,router);

app.use(bodyParser.json());
app.use(cors());
app.use(ExpressAPILogMiddleware(logger, { request: true }));

// app.get('/', (req, res) => {
//     res.status(200).send('hello world');
// });


app.listen(config.port, config.host, (e)=> {
    if(e) {
        throw new Error('Internal Server Error');
    }
    logger.info(`${config.name} running on ${config.host}:${config.port}`);
});

module.exports = app;