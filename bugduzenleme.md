CANVA CONFIGURATION BUG FOUND.

Current issues:

1. UI input contains Canva Client ID and Secret.
But application still says:
"Canva Client ID is not configured."

This means frontend form values are NOT being passed into backend configuration.

FIX THIS:

- Persist Canva Client ID from settings form
- Persist Canva Client Secret from settings form
- Store securely
- Load them for OAuth connection flow

Connection must use saved user settings, not hardcoded env-only config.

==================================================

SECOND ISSUE:

Sandbox mode is still active.

UI shows:
"SANDBOX ACTIVE"

This means mock Canva mode is still enabled.

Disable sandbox mode completely.

Remove:
- mock token logic
- sandbox fallback
- fake responses

Use only real Canva OAuth tokens.

==================================================

THIRD ISSUE:

OAuth redirect URI consistency.

Current UI:
http://127.0.0.1:3001/api/canva/callback

Ensure Canva developer portal EXACTLY matches:
http://127.0.0.1:3001/api/canva/callback

No localhost.
No port mismatch.
No 3000 if app runs on 3001.

==================================================

REQUIRED RESULT:

User enters:
Client ID
Client Secret

Clicks:
Connect Canva Account

System:
- saves credentials
- disables sandbox
- uses real OAuth
- connects real Canva account
- confirms workspace connection

Do not use env-only configuration.