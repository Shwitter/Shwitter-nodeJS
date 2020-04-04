const userModel = require("../models/userModel");

newUsersRegistration = (req, res, next) => {
    const users = userModel.users();
    //Show JSON object of Meals Menu data
    res.json(users);

};

loginUser = (req, res, next) => {
    const users = userModel.users();
    //Show JSON object of Meals Menu data
    res.json(users);

}

resetPassword = (req, res, next) => {
    const users = userModel.users();
    //Show JSON object of Meals Menu data
    res.json(users);
}

module.exports = {
    newUsersRegistration,
    loginUser,
    resetPassword
}