const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
    }
})

const commentsSchema = mongoose.Schema({
    comments: [commentSchema]
})
let Comments = mongoose.model('comments', commentsSchema);

module.exports = Comments;
