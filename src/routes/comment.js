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
        let newComment = {
            body: req.body.body,
            author: req.user.id,
            created: Date.now(),
            updated: Date.now()
        }
        console.log(req.user.id)

        comments.comments.push(newComment)

        console.log(comments)
        await comments.save()

        let response = await commentModel.findById(req.body.comment_id)
            .populate('comments.author', 'username avatar');
        res.status(200).json(response);

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
        if (!comments) res.status(400).json('Comment not found');
        for (let e of comments.comments) {

            //Check if comments match
            if (e._id.toString() === newData.comment_id.toString()){

                //Check if authors match
                if (e.author.toString() === req.user.id.toString()){
                    let index = comments.comments.indexOf(e)
                    comments.comments[index].body = newData.body;
                    comments.comments[index].updated = Date.now();
                    await comments.save()

                    let response = await commentModel.findById(req.body.comments_id)
                        .populate('comments.author', 'username avatar');

                    res.status(200).json(response);

                    setTimeout(() => {
                        Stream.emit('push', 'shweet_comments_update', {
                            msg: 'shweet comments just updated.',
                            author: req.user.id,
                            comments_id: comments._id
                            //TODO
                        });
                        console.log('shweet comments updated')
                    })
                } else {
                    res.status(403).json('Permission denied')
                }
            }
        }
    } catch (e) {
        res.status(500).json('server error')
        console.error(e)
    }
})

// Delete Comment
router.delete('/comment/:id', auth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {
        console.log(req.params.id)
        let comments = await commentModel.findById(req.body.comments_id);
        if (!comments) res.status(400).json('Comments not found');

        let index = -1
        for (const e of comments.comments) {
            if (e._id.toString() === req.params.id.toString()){
                if (e.author.toString() === req.user.id.toString()){
                    index = comments.comments.indexOf(e)
                    comments.comments.splice(index, 1)
                    await comments.save()

                    let response = await commentModel.findById(req.body.comments_id)
                        .populate('comments.author', 'username avatar');

                    res.status(200).json(response);

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
