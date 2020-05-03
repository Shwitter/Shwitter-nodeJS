const { check, validationResult } = require("express-validator");
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth')
const shweetModel = require('../models/shweetModel');
const commentModel = require('../models/commentModel');
const EventEmitter = require('events');
const Stream = new EventEmitter();

// Create comment.
router.post('/create', auth, async (req, res) => {
    const errors = validationResult(req);

    console.log(req.body)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {
        console.log(req.body.comment_id)
        let comments = await commentModel.findById(req.body.comment_id);
        if (!comments) res.status(400).json('comments not found, might be wrong comments id');
        console.log(comments)
        let newComment = {
            body: req.body.body,
            author: req.user.id,
            created: Date.now(),
            updated: Date.now()
        }

        comments.comments.push(newComment)

        console.log(comments)
        comments.save()
        res.status(200).json(comments);

        setTimeout(() => {
            Stream.emit('push', 'shweet_comments_update', {
                msg: 'shweet comments just created.',
                author: req.user.id,
                comments_id: comments._id
                //TODO
            });
            console.log('shweet comments changed')
        })

    } catch (e) {
        console.error(e)
        res.status(400).json(e)
    }
})

// Update Comment.
router.post('/update', auth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {

        let newData = req.body;
        let comments = await commentModel.findById(req.body.comments_id);
        console.log(comments)
        if (!comments) res.status(400).json('Comment not found');
        for (const e of comments.comments) {
            if (e.author.toString() === req.user.id.toString()){
                if (e._id.toString() === newData.comment_id.toString()){
                    let index = comments.comments.indexOf(e)
                    comments.comments[index].body = newData.body;
                    await comments.save()
                    res.status(200).json('Updated successfully');

                    setTimeout(() => {
                        Stream.emit('push', 'shweet_comments_update', {
                            msg: 'shweet comments just updated.',
                            author: req.user.id,
                            comments_id: comments._id
                            //TODO
                        });
                        console.log('shweet comments updated')
                    })
                }
            } else {
                res.status(403).json('Permission denied')
            }
        }
    } catch (e) {
        res.status(500).json('server error')
        console.error(e)
    }
})

// Delete Comment
router.post('/delete/:id', auth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {
        console.log(req.params.id)
        let comments = await commentModel.findById(req.body.comments_id);
        console.log(comments)
        if (!comments) res.status(400).json('Comments not found');

        let index = -1
        for (const e of comments.comments) {
            if (e._id.toString() === req.params.id.toString()){
                if (e.author.toString() === req.user.id.toString()){
                    index = comments.comments.indexOf(e)
                    comments.comments.splice(index, 1)
                    await comments.save()
                    res.status(200).json('deleted successfully');
                    setTimeout(() => {
                        Stream.emit('push', 'shweet_comments_update', {
                            msg: 'shweet comments just deleted.',
                            author: req.user.id,
                            comments_id: comments._id
                            //TODO
                        });
                        console.log('shweet comments deleted')
                    })
                } else {
                    res.status(403).json('Permission denied')
                }
            }
        }
        if (index === -1) res.status(400).json('Comment not found');
    } catch (e) {
        res.status(500).json('error fetching')
        console.error(e)
    }
})


module.exports = router;
