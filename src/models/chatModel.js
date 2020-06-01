const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    roomName: { type: String },
    sender: { type: String},
    message: { type: String },
    receiver: {  type: String },
    created : { type: Date, default: Date.now()}
});

let Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
