// Excerpt from most-common-passwords-list
const commonPasswords = new Set([
  "123456",
  "password",
  "123456789",
  "12345678",
  "12345",
  "qwerty",
  "abc123",
  "football",
  "monkey",
  "letmein",
  "admin",
  "welcome",
  "login",
  "123123",
  "iloveyou",
  "1q2w3e4r",
  "1234",
  "000000",
  "passw0rd",
  "zaq12wsx",
]);

export function isCommonPassword(password: string): boolean {
  return commonPasswords.has(password.toLowerCase());
}