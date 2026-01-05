// Simple in-memory OTP storage
// In production, consider using Redis or database for OTP storage
const otpStore = new Map<
  string,
  { code: string; phoneNumber: string; expiresAt: number }
>();

const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOTP(clerkId: string, phoneNumber: string): string {
  const code = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY_TIME;

  otpStore.set(clerkId, { code, phoneNumber, expiresAt });

  // Clean up expired OTPs
  setTimeout(() => {
    otpStore.delete(clerkId);
  }, OTP_EXPIRY_TIME);

  return code;
}

export function verifyOTP(clerkId: string, inputCode: string): {
  valid: boolean;
  phoneNumber?: string;
} {
  const stored = otpStore.get(clerkId);

  if (!stored) {
    return { valid: false };
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(clerkId);
    return { valid: false };
  }

  if (stored.code !== inputCode) {
    return { valid: false };
  }

  // OTP is valid, return phone number and clean up
  const phoneNumber = stored.phoneNumber;
  otpStore.delete(clerkId);

  return { valid: true, phoneNumber };
}

export function getStoredPhoneNumber(clerkId: string): string | null {
  const stored = otpStore.get(clerkId);
  return stored?.phoneNumber || null;
}

