const crypto = require('crypto');

// Create Token and saving in cookie
const sendToken = (user, statusCode, res) => {
  const token = user.getJWTToken();
  //console.log("Generated Token:", token); 
  // Calculate the expiration date based on COOKIE_EXPIRE
  // const cookieExpire = new Date(
  //   Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
  // );
  const cookieExpire = new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000);

  function createHash(string) {
    const hash = crypto.createHash('sha256');  // Ensure using the same algorithm
    hash.update(string, 'utf-8');              // Specify encoding explicitly (optional)
    return hash.digest('hex');                 // Return consistent digest format
  }

  // console.log(user.email);
  let customerid = createHash(user.customerid);
  // console.log(customerid);
  let userData = {
    email: user.email,
    customerid: customerid,
  }


  // options for cookie
  const options = {
    expires: cookieExpire,
    httpOnly: true,
    secure: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: userData
  });
};

module.exports = sendToken;
