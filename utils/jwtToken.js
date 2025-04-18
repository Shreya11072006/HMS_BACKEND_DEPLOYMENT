//NOTE:: Generates a JWT token for a user, sets it as a cookie, and sends a response.

export const generateToken = (user, message, statusCode, res) => {
    const token = user.generateJsonWebToken();
    // Determine cookie name (ADMIN/PATIENT)
    const cookieName = user.role === 'Admin' ? 'adminToken' : 'patientToken';
  
    // Token is stored in cookie with EXPIRY time and HttpOnly
    res
      .status(statusCode)
      .cookie(cookieName, token, {
        expires: new Date(
          Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000   // 7d
        ),
         httpOnly: true,
         secure: true,
         sameSite: "None", // Cannot be modified by JS in the browser
                        // The cookie can only be sent back and forth between the server and the browser 
      })
      .json({
        success: true,
        message,
        user,
        token,
      });
  };
  
  