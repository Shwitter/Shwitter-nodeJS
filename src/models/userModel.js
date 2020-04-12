const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
});
 
// const UserSchema = mongoose.Schema({
//     username: {
//         type: String,
//         required: true,
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     password: {
//         type: String,
//         required: true,
//         minlength: 8,
//     }
// });

// const User = module.exports = mongoose.model('UserModel', UserSchema);
module.exports = mongoose.model('userModel', UserSchema);