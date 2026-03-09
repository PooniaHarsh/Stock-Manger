const jwt = require('jsonwebtoken');

/**
 * Authentication middleware.
 * Verifies the JWT token from the Authorization header.
 * Attaches decoded user data to req.user if valid.
 */
const auth = (req, res, next) => {
    try {
        // Get token from header (format: "Bearer <token>")
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
