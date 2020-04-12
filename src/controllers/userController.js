const userModel = require("../models/userModel");
const express = require('express');
const bcrypt = require('bcrypt');

newUsersRegistration = (req, res, next) => {
    console.log("ola");
    // const username = req.body.username;
    // const email = req.body.email;
    // const pass1 = req.body.password;


    const newUser = new userModel({
        username:req.body.username,
        email: req.body.email,
        password: req.body.password

    });
  //
  //   bcrypt.genSalt(10, function(err, salt){
  //       bcrypt.hash(newUser.password, salt, function(err, hash){
  //           if(err){
  //               console.log(err);
  //           }
  //           newUser.password = hash;
  //           newUser.save(function(err){
  //               if(err){
  //                   console.log(err);
  //                   return;
  //               }
  //               else{
  //                   req.flash('success', 'wohoo');
  //                   req.redirect('/login');
  //               }
  //           })
  //
  //       })
  //   })

    

};

// loginUser = (req, res, next) => {
//     const users = userModel.users();
//     //Show JSON object of Meals Menu data
//     res.json(users);

// }

// resetPassword = (req, res, next) => {
//     const users = userModel.users();
//     //Show JSON object of Meals Menu data
//     res.json(users);
// }
//
// module.exports = {
//     newUsersRegistration
//     // loginUser,
//     // resetPassword
// }

module.exports = newUsersRegistration;