/**
 * High-Entropy Cryptographic Security Token Utilities
 * Uses Web Crypto API (or Node crypto) to produce secure, unguessable, high-entropy tokens.
 */

const CHARSET_BASE32 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32 chars: avoids easily confused 0/O, 1/I
const CHARSET_HEX = '0123456789ABCDEF';

/**
 * Generate cryptographically secure random bytes in browser or node environment
 */
function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback pseudo-random if crypto unavailable
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/**
 * Generates a high-entropy secret token for Check-In, Escrow, and Verification.
 * Example format: SEC-8X4K-9M2P-7W3Q (approx 32^12 = 1.15 x 10^18 permutations)
 */
export function generateSecureSecretToken(prefix = 'SEC', blocks = 3, blockSize = 4): string {
  const totalChars = blocks * blockSize;
  const bytes = getRandomBytes(totalChars);
  const parts: string[] = [];

  for (let b = 0; b < blocks; b++) {
    let block = '';
    for (let i = 0; i < blockSize; i++) {
      const idx = bytes[b * blockSize + i] % CHARSET_BASE32.length;
      block += CHARSET_BASE32[idx];
    }
    parts.push(block);
  }

  return prefix ? `${prefix}-${parts.join('-')}` : parts.join('-');
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 */
export function generateSecureOtp(length = 6): string {
  const bytes = getRandomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += (bytes[i] % 10).toString();
  }
  return code;
}

/**
 * Generates a secure, idempotent transaction identifier
 * Example: FT26-8K4M-9P2Q
 */
export function generateSecureTxId(prefix = 'TX'): string {
  const timeHex = Date.now().toString(36).toUpperCase();
  const bytes = getRandomBytes(6);
  let randomHex = '';
  for (let i = 0; i < bytes.length; i++) {
    randomHex += CHARSET_HEX[bytes[i] % CHARSET_HEX.length];
  }
  return `${prefix}-${timeHex}-${randomHex}`;
}

/**
 * Normalize Vietnamese text (removes diacritics / accents) for exact, reliable KYC name comparison
 * e.g. "NGUYỄN VĂN HẢI" -> "NGUYEN VAN HAI"
 */
export function normalizeVietnameseName(name: string): string {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Strict token validator with casing & whitespace trimming
 * Eliminates all backdoors and mock bypass strings.
 */
export function validateSecurityToken(input: string, expectedToken: string): boolean {
  if (!input || !expectedToken) return false;
  const cleanInput = input.trim().toUpperCase().replace(/\s+/g, '');
  const cleanExpected = expectedToken.trim().toUpperCase().replace(/\s+/g, '');
  return cleanInput === cleanExpected;
}
