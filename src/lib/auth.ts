import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
}

export function generateOTP(length: number = 6) {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += randomInt(0, 10);
    }
    return otp;
}
