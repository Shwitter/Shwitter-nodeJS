const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
let express = require("express");
const router = express.Router();
router.post('/register', (req, res, next) => {
    const password = req.body.password;
    let newUser = new userModel({
        username: req.body.username,
        email: req.body.email,
        password: bcrypt.hashSync( password, 10 )
    });

    res.status(201).send({
        newUser
    });

});

// router.post('/login', (req,res, next) => {
//
// })
 
module.exports = router;

