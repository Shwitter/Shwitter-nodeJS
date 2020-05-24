const {check, validationResult} = require("express-validator");
const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
let express = require("express");
let router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth")

router.post('/register', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    console.log(password)
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
            password: bcrypt.hashSync(password, 10)
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
        console.log(err.message);
        res.status(500).send("Error in Saving");
    }
});

router.post('/login', async (req, res) => {
    const errors = validationResult(req);

    console.log(req.body)
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
        console.log(username)
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
                expiresIn: 3600000
            },
            (err, token) => {
                if (err) throw err;
                res.status(200).json({
                    token
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

//verify user with jwt token
router.get("/me", auth, async (req, res) => {
    try {
        // request.user is getting fetched from Middleware after token authentication
        let user = await userModel.findById(req.user.id);
        res.json(user);
    } catch (e) {
        res.send({message: "Error in Fetching user"});
    }
});

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
    if (user !== id) {
        try {
            let user1 = await userModel.findById(user);
            let user2 = await userModel.findById(id);
            if (!user2) res.status(404).json('Could not find user');

            let subscribes = user1.subscribes;
            let subscribers = user2.subscribers;

            if (subscribes.includes(id)) {
                let index = subscribes.indexOf(id);
                subscribes.splice(index, 1);
                user1.subscribes = subscribes;
                await user1.save();

                index = subscribers.indexOf(user);
                subscribers.splice(index, 1);
                user2.subscribers = subscribers;
                await user2.save();

                res.status(200).json({user1, action: 'unfollowed'})
            } else {
                user1.subscribes.push(id);
                await user1.save();

                user2.subscribers.push(user);
                await user2.save();
                res.status(200).json({user1, action: 'followed'});

            }

        } catch (e) {
            console.log(e);
            res.status(500).json('internal error');
        }
    }
})

module.exports = router;

