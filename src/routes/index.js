const userController = require("../controllers/userController");
const userModel = require("../models/userModel");


// appRoute = router => {
//   router.post('/register', userController.newUsersRegistration);
//   // router.get('/login', userController.loginUser);
//   // router.get('/reset-password', userController.resetPassword);
//
// };

let express = require("express");
let bodyParser = require("body-parser");
const router = express.Router();
// router.usage.

// router.use(bodyParser.urlencoded({ extended: false }));
// router.use(bodyParser.json());

// router.post("/register", userController.newUsersRegistration);


router.post('/register', (req, res, next) => {
   console.log('avoe');
   // const newUser = new userModel({
   //    username: req.body.username,
   //    email: req.body.email,
   //    password: req.body.password
   //
   // });
});
 
module.exports = router;

