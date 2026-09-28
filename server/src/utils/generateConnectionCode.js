import crypto from 'crypto';

export const generateConnectionCode = () => {
  // Generates a 6-character random alphanumeric string, uppercase
  return crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
};
