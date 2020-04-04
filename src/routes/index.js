const userController = require("../controllers/userController")

appRoute = router => {
  router.get('/register', userController.newUsersRegistration);
  router.get('/login', userController.loginUser);
  router.get('/reset-password', userController.resetPassword);

};

module.exports = (app, router) => {
    //Initialize Routes
    appRoute(router);
};

