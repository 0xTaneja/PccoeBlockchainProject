const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @param {string} role - User role (student or teacher)
 * @returns {string} JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
};

module.exports = generateToken; 