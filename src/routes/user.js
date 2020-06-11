const {check, validationResult} = require("express-validator");
const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
let express = require("express");
let router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth")
const multer = require('multer');
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, './public/user');
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

router.post('/register', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    try {
        let user = await userModel.findOne({
            email
        });
        let user_name = await userModel.findOne({
            username
        });
        if (user_name) {
            return res.status(400).json({
                msg: "Username Already Exists"
            });
        }

        if (user) {
            return res.status(400).json({
                msg: "User Already Exists"
            });
        }
        user = new userModel({
            username: username,
            email: email,
            password: bcrypt.hashSync(password, 10),
            avatar: 'public/avatar.png'
        });

        await user.save();
        //Payload for jwt token.
        const payload = {
            user: {
                id: user.id
            }
        };
        // Generate JWT token.
        jwt.sign(
            payload,
            "secret", {
                expiresIn: 3600000
            },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    token
                });
            }
        );

    } catch (err) {
        res.status(500).send("Error in Saving");
    }
});

router.post('/login', async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const {username, password} = req.body;
    try {
        let user = await userModel.findOne({
            username
        });
        if (!user)
            return res.status(400).json({
                message: "User Not Exist"
            });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({
                message: "Incorrect Password !"
            });

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            "secret",
            {
                expiresIn: 360000000
            },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    token,
                    username
                });
            }
        );
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

// Update user.
router.post("/update", auth, async (req, res) => {
    try {
        let user = await userModel.findById(req.user.id);
        let file = req.body.avatar;

        if (file)
            user.avatar = file

        await user.save();
        res.status(200).json(user);
    } catch (e) {
        console.log(e);
        res.status(500).json('Internal error.')
    }
})

//verify user with jwt token
router.get("/me", auth, async (req, res) => {
    try {
        // request.user is getting fetched from Middleware after token authentication
        let user = await userModel.findById(req.user.id)
            .select('subscribes subscribers username email avatar')
            .populate('subscribes', '-password')
            .populate('subscribers', '-password');
        res.json(user);
    } catch (e) {
        res.send({message: "Error in Fetching user"});
    }
});

//Get all users.
router.get("/all", auth, async (req, res) => {
    try {
        let users = await userModel.find({}).select('username email subscribers subscribes');
        res.status(200).json(users);
    } catch (e) {
        res.status(500).json('Internal error.')
    }
})

router.post("/change-password", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    try {
        const user = await userModel.findById(req.user.id);
        const oldPass = req.body.password;
        const newPass = req.body.newpass;
        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "The password does not match!"
            });
        } else {
            user.password = bcrypt.hashSync(newPass, 10)
        }
        user.save()
        res.status(200).json("Password changed successfully.");
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

router.post("/subscribe", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    let id = req.body.user_id;
    let user = req.user.id;
    let subscribed = req.body.subscribed;
    if (id === user) res.status(404).json('Could not find user');
    if (user !== id) {
        try {
            let user1 = await userModel.findById(user);
            let user2 = await userModel.findById(id);
            if (!user2) res.status(404).json('Could not find user');

            let subscribes = user1.subscribes;
            let subscribers = user2.subscribers;

            if (subscribed) {
                let index = subscribes.indexOf(id);
                subscribes.splice(index, 1);
                user1.subscribes = subscribes;
                await user1.save();

                index = subscribers.indexOf(user);
                subscribers.splice(index, 1);
                user2.subscribers = subscribers;
                await user2.save();
                let result = await userModel.findById(user)
                    .select('subscribes subscribers username email avatar')
                    .populate('subscribes', 'username avatar')
                    .populate('subscribers', 'username avatar');

                res.status(200).json({ result, action: 'ubsubscribed'})
            } else {
                user1.subscribes.push(id);
                await user1.save();

                user2.subscribers.push(user);
                await user2.save();
                let result = await userModel.findById(user)
                    .select('subscribes subscribers username email avatar')
                    .populate('subscribes', 'username avatar')
                    .populate('subscribers', 'username avatar');
                res.status(200).json({result, action: 'subscribed'});

            }

        } catch (e) {
            console.log(e);
            res.status(500).json('internal error');
        }
    }
})

router.get('/userlist' , function (req , res) {
    // console.log("aa");
    userModel.find({}).select('username').then(function (users) {
        res.send(users);
    });
});

module.exports = router;

