import User from '../models/User.js';
import { asyncHandler, ApiError } from '../middleware/error.js';
import { signToken, cookieOptions, publicUser } from '../utils/token.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already registered');

  const user = await User.create({ name, email, password });
  const token = signToken(user);
  res
    .cookie('token', token, cookieOptions)
    .status(201)
    .json({ success: true, token, user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email })
    .select('+password')
    .populate('cart.product');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  const token = signToken(user);
  res
    .cookie('token', token, cookieOptions)
    .json({ success: true, token, user: publicUser(user) });
});

export const googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new ApiError(400, 'Google credential missing');

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  
  const payload = ticket.getPayload();
  const { name, email } = payload;
  
  let user = await User.findOne({ email }).populate('cart.product');
  if (!user) {
    const password = crypto.randomBytes(16).toString('hex');
    user = await User.create({ name, email, password });
  }
  
  const token = signToken(user);
  res
    .cookie('token', token, cookieOptions)
    .json({ success: true, token, user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  res.json({ success: true, message: 'Logged out' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product');
  res.json({ success: true, user: publicUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, addresses, birthday, gender } = req.body;
  const user = await User.findById(req.user._id);
  
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (addresses) user.addresses = addresses;
  if (gender) user.gender = gender;
  
  if (birthday) {
    if (!user.birthday) {
      user.birthdaySetAt = new Date();
    }
    user.birthday = birthday;
  }
  
  await user.save();
  res.json({ success: true, user: publicUser(user) });
});

// Wishlist toggle
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  const idx = user.wishlist.findIndex((id) => id.toString() === productId);
  if (idx >= 0) user.wishlist.splice(idx, 1);
  else user.wishlist.push(productId);
  await user.save();
  res.json({ success: true, wishlist: user.wishlist });
});

// Cart sync
export const syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  
  const user = await User.findById(req.user._id);
  user.cart = items.map(item => ({
    product: item.productId,
    quantity: Math.min(item.quantity || 1, 10)
  }));
  
  await user.save();
  res.json({ success: true, cart: user.cart });
});

// Forgot Password
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    throw new ApiError(404, 'There is no user with that email');
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
  const html = `<p>You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password:</p>
  <a href="${resetUrl}" target="_blank">Reset Password</a>`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
      html,
    });

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    throw new ApiError(500, 'Email could not be sent');
  }
});

// Reset Password
export const resetPassword = asyncHandler(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired token');
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully' });
});

// Verify Reset Password Token
export const verifyResetToken = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired token');
  }

  res.json({ success: true, email: user.email, name: user.name });
});

// Update Preferences
export const updatePreferences = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  const user = await User.findById(req.user._id);
  
  if (theme) {
    user.preferences = user.preferences || {};
    user.preferences.theme = theme;
  }
  
  await user.save();
  res.json({ success: true, preferences: user.preferences });
});
