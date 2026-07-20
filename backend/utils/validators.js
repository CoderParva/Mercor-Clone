const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (email) => typeof email === 'string' && EMAIL_RE.test(email);

const isValidPassword = (password) =>
  typeof password === 'string' && password.length >= 6;

const isPositiveNumber = (n) => typeof n === 'number' && !Number.isNaN(n) && n >= 0;

module.exports = { isValidEmail, isValidPassword, isPositiveNumber };
