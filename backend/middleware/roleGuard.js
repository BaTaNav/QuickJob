/**
 * Role-Based Access Control Middleware
 *
 * Provides role-based authorization checking. Should be used after verifyJwt
 * middleware which sets req.user.role.
 *
 * Usage:
 *   const { requireRole } = require('./roleGuard');
 *
 *   // Single role check
 *   app.get('/admin/users', requireRole('admin'), getUsers);
 *
 *   // Multiple roles allowed (user must have one of these)
 *   app.delete('/jobs/:id', requireRole('admin', 'instructor'), deleteJob);
 *
 *   // Can also be used as array
 *   app.patch('/profile', requireRole('student', 'instructor', 'admin'), updateProfile);
 */

/**
 * Factory function that creates a role guard middleware
 *
 * @param {...string} allowedRoles - One or more role strings that are allowed
 * @returns {Function} Express middleware function
 *
 * @example
 *   requireRole('admin')
 *   requireRole('admin', 'instructor')
 *   requireRole('student', 'admin')
 */
function requireRole(...allowedRoles) {
  // Validate input
  if (allowedRoles.length === 0) {
    throw new Error('requireRole: At least one role must be specified');
  }

  // Normalize roles to lowercase for case-insensitive comparison
  const normalizedRoles = allowedRoles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please log in.',
        code: 'UNAUTHORIZED'
      });
    }

    // Check if user has a role
    if (!req.user.role) {
      return res.status(401).json({
        status: 'error',
        message: 'User role not found. Please log in again.',
        code: 'MISSING_ROLE'
      });
    }

    // Normalize user role to lowercase
    const userRole = String(req.user.role).toLowerCase();

    // Check if user role matches any allowed role
    if (!normalizedRoles.includes(userRole)) {
      const roleDisplay =
        normalizedRoles.length === 1
          ? `'${normalizedRoles[0]}'`
          : `one of ${normalizedRoles.map((r) => `'${r}'`).join(', ')}`;

      return res.status(403).json({
        status: 'error',
        message: `Access denied. This resource requires role: ${roleDisplay}.`,
        code: 'FORBIDDEN',
        required: normalizedRoles,
        userRole: userRole
      });
    }

    // Authorization successful, proceed to next middleware
    next();
  };
}

/**
 * Middleware factory for checking multiple roles (array syntax)
 * Alternative to using spread operator
 *
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 *
 * @example
 *   requireRoles(['admin', 'instructor'])
 */
function requireRoles(roles) {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error('requireRoles: Must provide non-empty array of roles');
  }

  return requireRole(...roles);
}

module.exports = {
  requireRole,
  requireRoles
};
