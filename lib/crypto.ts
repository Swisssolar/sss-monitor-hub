import crypto from "node:crypto";

/**
 * AES-256-GCM symmetric encryption for provider OAuth tokens and API secrets.
 *
 * Format of ciphertext (base64): [iv(12)][authTag(16)][ciphertext]
 *
 * The key is read from PROVIDER_TOKEN_ENCRYPTION_KEY (base64, 32 bytes).
 * Rotation: re-encrypt every connection when the key changes.
 */

const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey(): Buffer {
  const raw = process.env.PROVIDER_TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "PROVIDER_TOKEN_ENCRYPTION_KEY is not set. Generate a 32-byte base64 key."
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(
      `PROVIDER_TOKEN_ENCRYPTION_KEY must decode to 32 bytes, got ${key.length}.`
    );
  }
  return key;
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN + 1) {
    throw new Error("Ciphertext payload too short.");
  }
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

/** Safe accessor that returns null instead of throwing when the secret is empty. */
export function maybeDecrypt(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    return decryptSecret(payload);
  } catch {
    return null;
  }
}
