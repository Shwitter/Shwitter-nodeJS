const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    invoker: {
        type: mongoose.Schema.Types.ObjectID,
        ref: 'users'
    },
    type: {
        type: String
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectID,
        ref: 'users'
    },
    shwitt_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: 'shweet'
    },
    status: {
        type: Boolean
    },
    invokerUsername: {
        type: String
    },

});

let Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;