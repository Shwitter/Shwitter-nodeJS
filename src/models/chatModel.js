const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    sender: { type: String},
    message: { type: String },
    receiver: {  type: String },
    created : { type: Date, default: Date.now()},
    roomName: { type: String },

});

let Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
