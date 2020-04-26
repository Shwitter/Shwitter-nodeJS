const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
    // console.log(req)
    const token = req.header("token");
    // console.log(req.header);
    if (!token) return res.status(401).json({ message: "Auth Error" });
    // console.log(token)
    try {
        const decoded = jwt.verify(token, "secret");
        req.user = decoded.user;
        next();
    } catch (e) {
        console.error(e);
        res.status(500).send({ message: "Invalid Token" });
    }
};
