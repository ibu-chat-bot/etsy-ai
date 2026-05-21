FINAL CANVA PRODUCTION FIX.

We are moving from broken sandbox/mock integration to REAL production Canva OAuth integration.

CURRENT FACTS:
- Local app runs at:
http://localhost:3000
- Dashboard:
http://localhost:3000/dashboard
- Local network:
https://192.168.1.181:3000
- We are using Canva Connect API.
- OAuth previously connected but sandbox/mock mode remained active.
- Design creation returned HTTP 400 due to fake/mock implementation.

GOAL:
Create a REAL working Canva integration for automatic editable Etsy template generation.

==================================================
CRITICAL SECURITY FIX
==================================================

Current Canva credentials may be compromised.

DO NOT use old stored secrets.

Clear:
- stored Canva credentials
- stored OAuth tokens
- mock tokens
- sandbox state

Force fresh credential setup.

==================================================
REAL CONFIGURATION
==================================================

App base URL:
http://localhost:3000

OAuth callback:
http://127.0.0.1:3000/api/canva/callback

IMPORTANT:
Use 127.0.0.1 for Canva callback because Canva rejects localhost in redirect configuration.

Frontend may run on localhost.
OAuth callback must use:
http://127.0.0.1:3000/api/canva/callback

==================================================
REMOVE SANDBOX COMPLETELY
==================================================

DELETE:
- sandbox mode
- mock Canva mode
- fake token provider
- fake design IDs
- fake template links
- mock diagnostic responses

There must be ZERO simulation logic.

==================================================
SETTINGS FIX
==================================================

Current bug:
UI shows Client ID/Secret but backend says:
"Client ID not configured"

Fix:
settings form must persist credentials.

Store:
canva_client_id
canva_client_secret

Backend OAuth flow must read saved settings.

DO NOT rely only on environment variables.

==================================================
OAUTH FLOW
==================================================

Implement real Canva OAuth:

1. User clicks Connect Canva Account

2. Redirect to Canva auth URL

3. Canva returns authorization code

4. Backend exchanges code for:
- access token
- refresh token

5. Persist tokens securely

6. Mark workspace connected

7. Diagnostic test uses REAL access token

==================================================
DEBUG PANEL
==================================================

Add debug diagnostics:

Show:
- credentials saved
- sandbox OFF
- OAuth connected
- token exists
- token expiry
- workspace ID
- last Canva API response

==================================================
CANVA API VALIDATION
==================================================

Before full template generation, test minimal real Canva request.

Test endpoint with real token.

If test fails:
show exact error response.

==================================================
DESIGN CREATION STRATEGY
==================================================

DO NOT invent unsupported Canva API payloads.

First verify official supported endpoints.

Implement ONLY supported Canva Connect API flows.

Need confirmed support for:
- create design
- upload asset
- populate design content
- retrieve editable design link

If full programmatic editable design construction is unsupported:

fallback:
1. create Canva design
2. upload generated assets
3. return editable design workspace link

But use ONLY official API support.

==================================================
REDIRECT URI CONSISTENCY
==================================================

Ensure Canva developer portal EXACTLY contains:
http://127.0.0.1:3000/api/canva/callback

No localhost.
No port mismatch.
No 3001.

==================================================
SUCCESS CONDITION
==================================================

Working flow:

User:
enters Canva credentials
clicks connect

System:
authenticates with Canva
stores tokens
passes diagnostic test
creates real Canva design
returns valid editable Canva link

No sandbox.
No mock.
No fake IDs.
No fake links.

Production-ready implementation only.