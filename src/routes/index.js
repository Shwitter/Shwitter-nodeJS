userController = require("../controllers/userController");

exports.appRoute = router => {
  router.get("/register", userController.getMenuController);
};