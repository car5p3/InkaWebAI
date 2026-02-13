INTRODUCTION:
This is a test project for InkaWebAi specifically created for Bembex Lab by car5p3. I've made sure to make this documentation as much through and detailed as much as possible.

NOTE: Make sure to understand that this documentation is only for the server(Backend) part fo the project.

I specifically choose Node.js for the ease of scalablity and maintainability of the project, in the near future if the need arrives.

ARCHITECTURE:
This project is completely based on MRCS (Models, Routes, Controllers, and Services) architecture.
For connecting it with the frontend I'm going to use AXIOS (in the client part) as it offers several benefits over the native Fetch API, primarily in providing built-in features that require manual implementation with fetch, such as automatic JSON parsing, better error handling, and request/response interceptors. 


ROUTES & IT'S DATA OBJECTS:

=========================AUTH==========================

=> SIGNUP
LINK: http://localhost:1000/api/auth/signup
METHOD: POST
JSON: { 
  "username": "<Your username>",
  "email": "<Your Configured Mailtrap Email (in testing)>", 
  "password": "<Your Password>" 
}

=> EMAIL VERIFICATION
LINK: http://localhost:1000/api/auth/verify-email
METHOD: POST
JSON: {
  "token":"<Your Token via email>"
}

=> LOGIN
LINK: http://localhost:1000/api/auth/
METHOD: POST
JSON: {
    "email" : "<your email>",
    "password" : "<Your Password>"
}

=> FORGOT PASSWORD
LINK: http://localhost:1000/api/auth/forgot-password
METHOD: POST
JSON: {
    "email" : "<your email>"
}

=> RESET PASSWORD
LINK: http://localhost:1000/api/auth/reset-password/:token
METHOD: POST
JSON: {
    "password" : "<Your New Password>",
    "passwordConfirm" : "<Confirm Your New Password>"
}


==========================END========================