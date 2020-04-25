const {check, validationResult} = require("express-validator");
const express = require('express');
const router = express.Router();
const shweetModel = require('../models/shweetModel');
const commentModel = require('../models/commentModel');
const auth = require('../middleware/auth')
// app.

// Get all shweets.
router.get('/home', auth, async (req, res) => {
    try {
        let shweets = await shweetModel.find({}, (err, shweets) => {
            return shweets
        })

        // res.json(shweets)

        res.writeHead(200, {
            Connection: "keep-alive",
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache"
        })
        console.log(shweets)
        // setTimeout(() => {
        res.write(`data: ${JSON.stringify(shweets)}`)
        res.write("\n\n");
        // }, 3000)
        req.on('close', () => {
            console.log('Connection closed')
        })
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
        let comments = commentModel.findById(shweet.comments)
        response.comments = comments.comments
        // console.log(comments)
        console.log(comments.comments)
        console.log(response)
        res.json(response)

    } catch (e) {
        console.error(e);
    }
})

//Create Sweet.
router.post('/shweet/create', auth, async (req, res) => {
    const errors = validationResult(req);
    try {
        console.log(req.user)
        res.status(200).json('kaia')

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
            res.status(200).json('Shweet updated successfully!')
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
        console.log(id)
        console.log(user)
        let shweet = await shweetModel.findById(id);
        if (!shweet) res.status(200).json('Could not find shweet');

        let likers = shweet.likes;
        console.log(likers)
        if (likers.includes(user)) {
            let index = likers.indexOf(user)
            likers.splice(index, 1)
            shweet.likes = likers;
            await shweet.save()

            res.status(200).json('liked')
        } else {
            likers.push(user);
            shweet.likes = likers;
            await shweet.save()
            res.status(200).json('unliked')
        }
    } catch (e) {
        res.status(500).json('server error')
        console.error(e)
    }

})

module.exports = router;
