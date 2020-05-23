const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
});


// autoIncrement.initialize(mongoose.connection);src/routes/index.js
// UserSchema.plugin(autoIncrement.plugin, 'User');
let User = mongoose.model('users', UserSchema);

module.exports = User;