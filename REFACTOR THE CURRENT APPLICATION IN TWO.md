STOP CURRENT CANVA APP SDK APPROACH.

Do NOT build a Canva embedded app.

The current Canva developer app setup is the wrong architecture.

We do NOT need a Canva app running inside Canva editor.

We need Canva OAuth + Canva Connect API backend integration.

GOAL:
Automatically create editable Canva template designs from my internal SaaS application.

Required architecture:

1. OAuth Canva account connection
- connect my Canva account
- store access token securely
- store refresh token
- reconnect automatically

2. Canva backend integration
Use official Canva Connect API.

Required capabilities:
- create design
- create multi-page design
- upload assets
- insert text elements
- insert images
- set colors
- apply typography
- duplicate pages
- generate editable share/template links

3. Internal workflow
User enters:
product name
niche
style
template count

AI generates:
- design JSON
- layout JSON
- placeholder copy
- image prompts

Then:
system generates images

Then:
system builds Canva design automatically

Then:
returns Canva editable template link

IMPORTANT:
Do NOT use Canva App SDK architecture.

Use backend OAuth API integration only.

Remove any code assuming localhost Canva app development environment.

Add settings screen:
"Connect Canva Account"

Add Canva integration module:
- auth connect
- callback handler
- token storage
- template builder

Use production backend architecture.