import { customAlphabet } from "nanoid";

// URL-safe alphabet, 21 chars — same default length/entropy as nanoid's default.
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  21,
);

export function generateToken(): string {
  return nanoid();
}
