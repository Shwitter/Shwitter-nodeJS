const mongoose = require('mongoose');

const shweetSchema = mongoose.Schema({
    body: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectID,
        ref: 'users'
    },
    created: {
        type: Date
    },
    updated: {
        type: Date
    },
    likes: [{
        type : mongoose.Schema.Types.ObjectID,
        ref: 'users'
    }],
    comments: {
        type: mongoose.Schema.Types.ObjectID,
        ref: 'comments',
        default: undefined
    },
    shweetImages: [{
        type: String,
    }]

})
let Shweet = mongoose.model('shweet', shweetSchema);

module.exports = Shweet;
