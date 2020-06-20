const {check, validationResult} = require("express-validator");
const express = require('express');
const router = express.Router();
const shweetModel = require('../models/shweetModel');
const commentModel = require('../models/commentModel');
const notificationModel = require('../models/notificationModel');
const userModel = require("../models/userModel");
const auth = require('../middleware/auth')
const eventEmitter = require('../lib/eventEmitter')

// const multer = require('multer');
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/shweet');
//     },
//     filename: function (req, file, cb) {
//         cb(null, new Date().toISOString() + '_' + file.originalname.replace(/ /g, '_'));
//     }
// })
// const upload = multer({
//     storage: storage,
//     limits: {
//         fileSize: 1024 * 1024 * 5
//     }
// })
// const Stream = new EventEmitter();


// Get all subscribed shweets.
router.get('/subscribed-shweets', auth, async (req, res) => {
    try {
        let shweets = {};
        let user = await userModel.findById(req.user.id);
        let subscribes = user.subscribes;
        let neededShweets = subscribes;
        neededShweets.push(req.user.id);
        // Merge shweets with it's own comments, get only subscribed shweets.
        shweets = await shweetModel.find({author: {"$in": neededShweets}}, (err, shweets) => {
            return shweets
        })
            .lean()
            .populate('likes', 'username avatar')
            .populate({
                path: 'comments',
                populate: {path: 'comments.author', select: 'username avatar'}
            })
            .populate('author', 'username avatar')
            .sort('-created')
            .exec();

        shweets.forEach(shweet => {
            let BreakException = {};
            shweet.liked = false;
            try {
                shweet.likes.forEach(liker => {
                    if (shweet.liked === true)
                        throw BreakException;

                    // Check if user has liked and break loop.
                    shweet.liked = user._id.toString() === liker._id.toString();
                })
            } catch (e) {
                if (e !== BreakException) throw e;
            }

            shweet.subscribed = user.subscribes.includes(shweet.author._id);
        })

        res.status(200).json(shweets)

    } catch (e) {
        res.status(500).json('Server error')
    }

});

// Get all shweets.
router.get('/shweets', auth, async (req, res) => {
    try {
        let shweets = {};

        // Merge shweets with it's own comments.
        shweets = await shweetModel.find()
            .lean()
            .populate('likes', 'username avatar')
            .populate({
                path: 'comments',
                populate: {path: 'comments.author', select: 'username avatar'}
            })

            .populate('author', 'username avatar')
            .sort('-created')
            .exec();

        let user = await userModel.findById(req.user.id).select('username avatar subscribes')
        console.log(user)
        shweets.forEach(shweet => {
            let BreakException = {};
            shweet.liked = false;
            try {
                shweet.likes.forEach(liker => {
                    if (shweet.liked === true)
                        throw BreakException;

                    // Check if user has liked and break loop.
                    shweet.liked = user._id.toString() === liker._id.toString();
                })
            } catch (e) {
                if (e !== BreakException) throw e;
            }

            shweet.subscribed = user.subscribes.includes(shweet.author._id);

        })
        res.status(200).json(shweets)

    } catch (e) {
        res.status(500).json('Server error')
    }

});

//Get single shweet.
router.get('/shweet/:id', auth, async (req, res) => {
    try {
        let shweet = await shweetModel.findById(req.params.id)
            .lean()
            .populate({
                path: 'comments',
                populate: {path: 'comments.author', select: 'username avatar'}
            })
            .populate('likes', 'username')
            .exec();
        if (!shweet) res.status(400).json('Shweet not found');

        let likers = await shweetModel.findById(req.params.id);
        let user = await userModel.findById(req.user.id);

        shweet.liked = likers.likes.includes(req.user.id);
        shweet.subscribed = user.subscribes.includes(shweet.author._id)

        res.status(200).json(shweet)

    } catch (e) {
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

        shweetComments.save()

        let shweet = new shweetModel({
            body: req.body.body,
            author: req.user.id,
            created: Date.now(),
            updated: Date.now(),
            comments: shweetComments._id,
            shweetimages: req.body.shweetimage
        });

        await shweet.save();

        let response = await shweetModel.findById(shweet._id)
            .populate('author', 'username')
            .populate({
                path: 'comments',
                populate: {path: 'comments.author', select: 'username avatar'}
            })
        ;

        let user = await userModel.findById(req.user.id)
            .populate('subscribers', 'username');
        let subscribers = user.subscribers;

        //Create and save notification into database
        subscribers.forEach((value, key) => {
            let notification = new notificationModel({
                invoker: response.author._id,
                invokerUsername: response.author.username,
                receiver: value._id,
                shwitt_id: response._id,
                type: "shwitte",
                status: false
            });
            notification.save();
        }).then(() => {
            //Emit shweet created event.
            eventEmitter.emit('on-shweet-create', subscribers, response);
        })




        res.status(200).json(response)


    } catch (e) {
        res.status(500).send('Error in Saving')
    }

})

// Update Shweet.
router.post('/shweet/update', auth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {

        let newData = req.body;
        let shweet = await shweetModel.findById(req.body._id)
            .populate('author', 'username')
            .populate('likes', 'username avatar')
            .populate({
                path: 'comments',
                populate: {path: 'comments.author', select: 'username avatar'}
            });
        if (!shweet) res.status(400).json('Shweet not found');
        if (req.user.id.toString() === shweet.author.toString()) {

            shweet.body = newData.body;
            shweet.updated = Date.now();
            if (newData.shweetimage)
                shweet.shweetimages = newData.shweetimage;

            await shweet.save();
            let user = await userModel.findById(req.user.id)
                .populate('subscribers', 'username');
            let subscribers = user.subscribers;
            //Emit shweet created event.
            // eventEmitter.emit('shweet-updated', subscribers, shweet)

            res.status(200).json(shweet)
        }

    } catch (e) {
        res.status(500).json('error fetching')
        console.error(e)
    }
})

// Delete shweet
router.post('/shweet/delete/:id', auth, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    try {
        let shweet = await shweetModel.findById(req.params.id)
        if (!shweet) res.status(400).json('Shweet not found');
        if (req.user.id.toString() === shweet.author.toString()) {
            // Delete post and it's own comments
            let comments = commentModel.findById(shweet.comments.toString())
            await shweet.deleteOne()
            await comments.deleteOne()
        }
        let user = await userModel.findById(req.user.id)
            .populate('subscribers', 'username');
        let subscribers = user.subscribers;
        //Emit shweet created event.
        // eventEmitter.emit('shweet-deleted', subscribers, req.params.id)
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
        let action = req.body.liked;
        let userId = req.user.id;
        let user = await userModel.findById(userId)
            .populate('subscribers', 'username');
        let subscribers = user.subscribers;

        let shweet = await shweetModel.findById(id)
            .populate('author', 'username avatar')
            .populate({
                path: 'comments',
                populate: {path: 'comments.author', select: 'username avatar'}
            });
        if (!shweet) res.status(200).json('Could not find shweet');

        let likers = shweet.likes;
        if (action === true) {
            likers.push(userId);
            shweet.likes = likers;
            await shweet.save()
            let result = await shweetModel.findById(id)
                .lean()
                .populate('author', 'username avatar')
                .populate({
                    path: 'comments',
                    populate: {path: 'comments.author', select: 'username avatar'}
                })
                .exec();

            eventEmitter.emit('on-like-change', subscribers, shweet, action);

            //Create and save notification into database
            let notification = new notificationModel({
                invoker: user._id,
                invokerUsername: user.username,
                receiver: result.author._id,
                type: "liked",
                shwitt_id: result._id,
                status: false
            });
            notification.save().then(() => {
                eventEmitter.emit('on-like-change', subscribers, shweet, action);
            });

            result.liked = true;
            res.status(200).json(result)
            //Emit shweet created event.
        } else if (action === false) {
            let index = likers.indexOf(userId)
            likers.splice(index, 1)
            shweet.likes = likers;
            await shweet.save()

            let result = await shweetModel.findById(id)
                .lean()
                .populate('author', 'username avatar')
                .populate({
                    path: 'comments',
                    populate: {path: 'comments.author', select: 'username avatar'}
                })
                .exec();
            result.liked = false;
            eventEmitter.emit('on-like-change', subscribers, shweet, action);
            res.status(200).json(result)
        } else {
            res.status(400).json('Missing action.')
        }


    } catch (e) {
        res.status(500).json('server error')
        console.error(e)
    }

})


module.exports = router;
