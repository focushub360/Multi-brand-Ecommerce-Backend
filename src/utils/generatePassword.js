import crypto from 'crypto';

/**
 * Generates a cryptographically secure random password of exact length.
 * Default length: 12 characters (as required for dealer temporary credentials).
 * Includes uppercase, lowercase, numbers, and special symbols.
 */
export const generateSecurePassword = (length = 12) => {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excludes ambiguous letters like I, O
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'; // Excludes l
  const numbers = '23456789'; // Excludes 0, 1
  const symbols = '!@#$%^&*()_+';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Guarantee at least one from each character group
  let password = [
    uppercase[crypto.randomInt(0, uppercase.length)],
    lowercase[crypto.randomInt(0, lowercase.length)],
    numbers[crypto.randomInt(0, numbers.length)],
    symbols[crypto.randomInt(0, symbols.length)]
  ];

  // Fill the remaining characters randomly
  for (let i = password.length; i < length; i++) {
    password.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  // Cryptographically shuffle the characters using Fisher-Yates
  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
};

