const catchAsync = require("../utils/catchAsync");
const authService = require("../services/authService");

const loginWithEmail = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { token, user } = await authService.emailLogin(email, password);

  res.status(200).json({
    status: "success",
    token,
    data: { user },
  });
});

const loginWithGoogle = catchAsync(async (req, res, next) => {
  const { idToken } = req.body;
  const result = await authService.googleLogin(idToken);

  res.status(200).json({
    status: "success",
    token: result.token,
    user: result.user,
  });
});

module.exports = { loginWithEmail, loginWithGoogle };