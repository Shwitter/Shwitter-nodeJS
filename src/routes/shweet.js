const {check, validationResult} = require("express-validator");
const express = require('express');
const router = express.Router();
const shweetModel = require('../models/shweetModel');
const commentModel = require('../models/commentModel');
const auth = require('../middleware/auth')
const EventEmitter = require('events');
const Stream = new EventEmitter();


// Get all shweets.
router.get('/shweets', auth, async (req, res) => {
    try {
        let shweets = {};
        // Merge shweets with it's own comments.
        shweets = await shweetModel.find({}, (err, shweets) => {
            console.log(shweets)
            return shweets
        }).populate('comments')

        res.status(200).json(shweets)

    } catch (e) {
        console.log(e)
    }

});

//Get single shweet.
router.get('/shweet/:id', auth, async (req, res) => {
    try {
        let shweet = await shweetModel.findById(req.params.id)
        if (!shweet) res.status(400).json('Shweet not found');
        console.log(shweet)
        let response = shweet;
        response.comments = await commentModel.findById(shweet.comments);
        let comments = await commentModel.findById(shweet.comments)
        response.comments = comments.comments
        // console.log(comments)
        console.log(comments.comments)
        console.log(response)
        res.status(200).json(response)

    } catch (e) {
        console.error(e);
        res.status(500).json('Server error')

    }
})

//Create Sweet.
router.post('/shweet/create', auth, async (req, res) => {
    const errors = validationResult(req);
    try {

        // Create empty comments object
        let shweetComments = new commentModel({
            comments: []
        });
        console.log(shweetComments)
        console.log(shweetComments.comments)
        shweetComments.save()

        let shweet = new shweetModel({
            title: req.body.title,
            body: req.body.body,
            author: req.user.id,
            created: Date.now(),
            updated: Date.now(),
            comments: shweetComments._id
        });

        await shweet.save();
        console.log(await commentModel.findById(shweetComments._id))
        console.log(shweet)
        setTimeout(() => {
            Stream.emit('push', 'new_shweet', {
                msg: 'user has just shweeted',
                author: req.user.id
            });
            console.log('shweet created')
            console.log(req.user)
        })
        res.status(200).json(shweet)


    } catch (e) {
        console.log(e);
        res.status(500).send('Error in Saving')
    }

})

// Update Shweet.
router.post('/shweet/update', auth, async (req, res) => {
    const errors = validationResult(req);

    console.log(req.body)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {

        let newData = req.body;
        let shweet = await shweetModel.findById(req.body._id);
        if (!shweet) res.status(400).json('Shweet not found');
        if (req.user.id.toString() === shweet.author.toString()) {

            shweet.title = newData.title;
            shweet.body = newData.body;
            shweet.updated = Date.now();

            await shweet.save();
            console.log(shweet)
            setTimeout(() => {
                Stream.emit('push', 'update_shweet', {
                    msg: 'user has just updated shweet',
                    author: req.user.id
                });
                console.log('shweet updated')
            })

            res.status(200).json(shweet)
        }

    } catch (e) {
        res.status(500).json('error fetching')
        console.error(e)
    }
})

// Delete shweet
router.delete('/shweet/delete/:id', auth, async (req, res) => {
    const errors = validationResult(req);

    console.log(req.body)
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {
        console.log(req.params.id)
        let shweet = await shweetModel.findById(req.params.id)
        console.log(shweet)
        if (!shweet) res.status(400).json('Shweet not found');
        if (req.user.id.toString() === shweet.author.toString()) {
            // Delete post and it's own comments
            let comments = commentModel.findById(shweet.comments.toString())
            console.log(comments)
            await shweet.deleteOne()
            await comments.deleteOne()
        }
        res.status(200).json('done')
    } catch (e) {
        res.status(500).json('error fetching')
        console.error(e)
    }
})

// Like shweet.
router.post('/shweet/like', auth, async (req, res) => {
    try {
        let id = req.body.shweet_id;
        let user = req.user.id;
        // console.log(id)
        // console.log(user)
        let shweet = await shweetModel.findById(id);
        if (!shweet) res.status(200).json('Could not find shweet');

        let likers = shweet.likes;
        // console.log(likers)
        if (likers.includes(user)) {
            let index = likers.indexOf(user)
            likers.splice(index, 1)
            shweet.likes = likers;
            await shweet.save()
            res.status(200).json({shweet, action: 'unliked'})
        } else {
            likers.push(user);
            shweet.likes = likers;
            await shweet.save()
            res.status(200).json({shweet, action: 'liked'})
        }
        setTimeout(() => {
            Stream.emit('push', 'shweet_likes_update', {
                msg: 'shweet likes just updated.',
                author: req.user.id,
                shweet: shweet
            });
            console.log('shweet likes changed')
        })

    } catch (e) {
        res.status(500).json('server error')
        console.error(e)
    }

})

// Make connection for events.
router.get('/events', auth, async (req, res) => {
    try {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive'
        });

        Stream.on('push', (event, data) => {
            res.write('event: ' + String(event) + '\n' + 'data: ' + JSON.stringify(data) + '\n\n');
        });

        setTimeout(() => {
            Stream.emit('push', 'status', {
                msg: 'connection established!'
            });
            console.log(`${req.user.id} Connection started`)
        });

        req.on('close', () => {
            console.log(`${req.user.id} Connection closed`)
        })

    } catch (e) {
        console.log(e)
    }

});


module.exports = router;
