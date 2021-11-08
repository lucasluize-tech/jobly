"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when ADMIN must be logged in.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    
    if (!res.locals.user) {
      return next(new UnauthorizedError())      
    } else if (!res.locals.user.isAdmin) {
       return next(new UnauthorizedError())

    } else if (res.locals.user.isAdmin === true) {
       return next()
    }
    return next(new UnauthorizedError())
    
  } catch (err) {
    return next(err);
  }
}

async function ensureSameUserOrAdmin(req, res, next) {
  try {
    if (!res.locals.user) {
      return next(new UnauthorizedError())
    }
    
    const user = res.locals.user.username
    console.log(`user: ${user}`)
    
    if (res.locals.user.isAdmin === true || user === req.params.username){
    console.log(req.params.username)
      return next()
    }
    return next(new UnauthorizedError())
    
  } catch (err) {
    return next(err)
  }
}


module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureSameUserOrAdmin
};
