import bcrypt from 'bcryptjs';

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function otpExpiryISO(): string {
  return new Date(Date.now() + OTP_EXPIRY_MS).toISOString();
}

export function isOTPExpired(expiryISO: string): boolean {
  return new Date(expiryISO) < new Date();
}

export function hasExceededAttempts(attempts: number): boolean {
  return attempts >= MAX_ATTEMPTS;
}

export { MAX_ATTEMPTS, OTP_EXPIRY_MS };
