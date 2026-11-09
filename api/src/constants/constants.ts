const TURN_TOKEN_ID = '06379bf0fccbdda34fcd7a5e62fe8ea7'
export const TURN_CREDENTIALS_URL = `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_TOKEN_ID}/credentials/generate-ice-servers`
export const TURN_CREDENTIAL_TTL = 60 // 60 seconds

export const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
