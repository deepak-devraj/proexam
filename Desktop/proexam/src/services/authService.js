const User = require('../models/User');

const createUser = async (fullName, email, password, confirmPassword) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error("User already exists");

    let baseUsername = email.split("@")[0];
    let userName = baseUsername;
    let counter = 1000;
    while (await User.exists({ userName })) {
        userName = `${baseUsername}${counter++}`;
    }

    // Pass PLAIN password; the Model pre-save hook handles hashing
    const newUser = new User({ fullName, email, password, userName })
    await newUser.save();
    return newUser;
};

const checkPassword = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 400;
        throw error;
    }
    // compare plain text password with hashed password in DB
    const isMatch = await require('bcryptjs').compare(password, user.password);
    if (!isMatch) {
        const error = new Error("Incorrect Password");
        error.statusCode = 400;
        throw error;
    }
    return user;
};

module.exports = { createUser, checkPassword };