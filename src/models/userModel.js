const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
});


autoIncrement.initialize(mongoose.connection);
UserSchema.plugin(autoIncrement.plugin, 'User');
let User = mongoose.model('User', UserSchema);

module.exports = User;