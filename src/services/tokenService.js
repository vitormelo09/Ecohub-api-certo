const jwt = require('jsonwebtoken');

const SECRET = "seu_segredo_super_secreto";

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email },
        SECRET,
        { expiresIn: "1h" }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, SECRET);
};

module.exports = {
    generateToken,
    verifyToken
};      