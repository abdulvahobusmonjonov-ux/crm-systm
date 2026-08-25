import crypto from "crypto";

export interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface VerifyResult {
  valid: boolean;
  user: TelegramWebAppUser | null;
  authDate: number | null;
  error?: string;
}

/**
 * Verifies Telegram Mini App `initData` per the official spec:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * - Computes secret_key = HMAC_SHA256("WebAppData", bot_token)
 * - Computes hash = HMAC_SHA256(secret_key, data_check_string)
 * - data_check_string = all fields except `hash`, sorted alphabetically as "key=value" joined by "\n"
 */
export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSeconds = 86400): VerifyResult {
  if (!initData || !botToken) return { valid: false, user: null, authDate: null, error: "missing_input" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { valid: false, user: null, authDate: null, error: "missing_hash" };
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const validSignature =
    computedHash.length === hash.length &&
    crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(hash, "hex"));

  if (!validSignature) return { valid: false, user: null, authDate: null, error: "bad_signature" };

  const authDateStr = params.get("auth_date");
  const authDate = authDateStr ? parseInt(authDateStr, 10) : null;
  if (authDate && Date.now() / 1000 - authDate > maxAgeSeconds) {
    return { valid: false, user: null, authDate, error: "expired" };
  }

  const userStr = params.get("user");
  let user: TelegramWebAppUser | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      user = null;
    }
  }

  return { valid: true, user, authDate };
}
