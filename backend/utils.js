import jwt from 'jsonwebtoken'; 

// Middlewares for user authentication and authorization.

// Generate a JSON Web Token (JWT) for user authentication.
export const generateToken = (user) => {
  return jwt.sign (  // used to create the token with the user's details.
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      isAdmin: user.isAdmin,
    },
    "308573ea97f208933033027caaf7c3e4484a9404e939e20547a7a19a4aeef406e89ca47e9334a17efb86d544f89b6f2335d2a9b244c2d40823af422e8a6538dc",
    { expiresIn: '30d' }
  );
  // second parameter is JWT secret, which is used to encrypt the data.
  // third parameter is an options object specifying the expiration time of the token (30 days in this case).
};

export const isAuth = (req, res, next) => {
// check if request authenticated by examining the authorization header.
const authorization = req.headers.authorization;
  if (authorization) {
// If the authorization header exists, it extracts the token from header.
    const token = authorization.slice (7, authorization.length); // Bearer XXXXXX (7 characters)
// jwt.verify function used to verify the token's validity and decode its contents.
  jwt.verify (token, "308573ea97f208933033027caaf7c3e4484a9404e939e20547a7a19a4aeef406e89ca47e9334a17efb86d544f89b6f2335d2a9b244c2d40823af422e8a6538dc", (err, decode) => {
      if (err) {
        res.status(401).send({ message: 'Invalid Token' });
        // if valid, decode is the decrypted version of the token that include user information, and it is stored in req.user.
      } else {
      req.user = decode;
        next();   //by calling next we go to the next middleware (expressAsyncHandler function from OrderRoutes)
      }
    });
  } else {
    res.status(401).send({ message: 'No Token' });
  }
};


// middleware to check if user is an admin.
export const isAdmin = (req, res, next) => {
  // verifies that req.user exists and has the isAdmin property set to true.
  if (req.user && req.user.isAdmin) {
    // If true, request proceeds to next middleware.
    next();
  } else {
        res.status(401).send({ message: 'Invalid Admin Token' });
  }
};