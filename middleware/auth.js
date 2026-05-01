/**
 * Authentication Middleware (auth.js)
 * 
 * Features:
 * - Protects secure routes by ensuring a valid JSON Web Token (JWT) is provided.
 * - Extracts the token from the "Authorization: Bearer <token>" HTTP header.
 * - Verifies the token's validity and expiration against the JWT_SECRET.
 * - Decodes the payload and attaches the user information (e.g., userId, email)
 *   to the request object (req.user) for downstream handlers.
 * - Responds with a 401 Unauthorized status if the token is missing, invalid, or expired.
 */
const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev_only');
        req.user = decoded; // { userId: '...', email: '...' }
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = { requireAuth };
