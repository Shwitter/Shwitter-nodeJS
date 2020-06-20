const {check, validationResult} = require("express-validator");
let express = require("express");
let router = express.Router();
const auth = require("../middleware/auth")
const notificationModel = require('../models/notificationModel')

router.get("/get-notifications", auth, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    try {
        let user = req.user.id;
        notificationModel.find({receiver: user, status: false}).then(function (doc) {
            if (doc.length > 0) {
                res.status(200).json(doc);
            } else {
                res.status(200).json({
                    'error': true
                })
            }
        })
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

router.post("/subscribe-status", auth, async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    try {
        let notificationIdArray = req.body.notification_id;
        notificationIdArray.forEach(element => {
            // let notification_id = req.body.notification_id;
            notificationModel.findById(element).then(function (doc) {
                doc.status = true;
                doc.save()
                res.status(200).json("success");
            })
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})

router.post("/shwitt-status", auth, async (req, res) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    try {
        let notification_id = req.body.notification_id;
        notificationModel.findById(notification_id).then(function (doc) {
            doc.status = true;
            doc.save();
            res.status(200).json("success");
        })
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Server Error"
        });
    }
})



module.exports = router;

