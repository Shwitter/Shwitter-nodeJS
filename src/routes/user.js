const { check, validationResult } = require("express-validator");
const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
let express = require("express");
let router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

router.post('/register', async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    try {
        let user = await userModel.findOne({
            email
        });
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
            "randomString", {
                expiresIn: 10000
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
        const user = await userModel.findById(req.user.id);
        res.json(user);
    } catch (e) {
        res.send({ message: "Error in Fetching user" });
    }
});

router.post("/change-password", auth, async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    try{
        const user = await userModel.findById(req.user.id);
        const oldPass = req.body.password;
        const newPass = req.body.newpass;
        const isMatch = await bcrypt.compare(oldPass, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "The password does not match!"
            });
        }
        else {
            user.password = bcrypt.hashSync(newPass, 10)
        }
        user.save()
        res.status(200).json("Password changed successfully.");
    }
    catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

module.exports = router;

