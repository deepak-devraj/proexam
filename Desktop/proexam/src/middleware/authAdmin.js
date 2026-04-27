const jwt = require("jsonwebtoken");
const User = require("../models/authmodel");

const authAdmin = async (req, res, next) => {
    try {
        const authHeaders = req.headers.authorization;
        if (!authHeaders || !authHeaders.startsWith("Bearer")) {
            return res.status(401).json({ message: "No Token Provided" });
        }
        const token = authHeaders.split(" ")[1];
        if (!token)
            return res
                .status(401)
                .json({ message: "No token, authentication failed" });
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
        const user = await User.findById(decoded.id).populate("role");
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.accountType !== "employee")
            return res.status(403).json({ message: "Access Denied" });
        req.userDetails = user;    //here userDetails nothing but admin details.. i have kept userDetails here because no need to write another block of code in auto approval condition
        next();
    } catch (e) {
        return res
            .status(401)
            .json({ message: "Invalid or expired token", error: e.message });
    }
};

module.exports = authAdmin;