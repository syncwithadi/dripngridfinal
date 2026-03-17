import Razorpay from 'razorpay';

// Razorpay instance - initialized lazily to avoid build errors
let razorpayInstance: Razorpay | null = null;

export const getRazorpay = (): Razorpay => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
};

// Razorpay configuration for client-side
export const razorpayConfig = {
  key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  currency: 'INR',
  name: 'DRIPNGRID',
  description: 'Premium Fashion',
  image: '/logo.png', // Add your logo
  theme: {
    color: '#000000',
  },
};

// Order amount is in paise (1 INR = 100 paise)
export const convertToPaise = (amountInRupees: number): number => {
  return Math.round(amountInRupees * 100);
};

// Convert from paise to rupees
export const convertFromPaise = (amountInPaise: number): number => {
  return amountInPaise / 100;
};

// Generate unique order number
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  // Result: DNG-YYYYMMDD-XXXX (Mocking serial-like structure)
  const date = new Date();
  const dateStr = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  return `DNG-${dateStr}-${random}`;
};

// Razorpay order creation options interface
export interface RazorpayOrderOptions {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

// Razorpay payment verification
export interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
