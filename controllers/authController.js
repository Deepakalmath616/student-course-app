const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function isNameValid(name) {
  return typeof name === 'string' && /^[A-Za-z\s]{2,60}$/.test(name.trim());
}
function isEmailValid(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isPasswordStrong(pw) {
  return typeof pw === 'string' && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pw);
}

exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, contact } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }
    if (!isNameValid(fullName)) return res.status(400).json({ error: 'Full name must contain only letters and spaces (2-60 chars).' });
    if (!isEmailValid(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });
    if (!isPasswordStrong(password)) return res.status(400).json({ error: 'Password must be at least 8 chars with upper, lower, number and special char.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ fullName: fullName.trim(), email: email.toLowerCase(), password: hashed, contact });
    await user.save();

    return res.status(201).json({ message: 'Registration successful. Please login.' });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ error: 'Server error. Try again later.' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '6h' });
    return res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ error: 'Server error. Try again later.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('fullName email contact createdAt');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ fullName: user.fullName, email: user.email, contact: user.contact, createdAt: user.createdAt });
  } catch (err) {
    console.error('Profile error', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
