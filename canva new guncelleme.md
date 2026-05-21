STOP TRYING TO IMPLEMENT CUSTOM CANVA DESIGN CREATION BLINDLY.

Current issue:
OAuth succeeds.
Scopes succeed.
Canva returns HTTP 400 on design creation.

Before continuing implementation:

1. Inspect the EXACT Canva API endpoint currently being called.

2. Print:
- request URL
- request method
- full request body
- full Canva response body

3. Verify against official Canva Connect API docs.

4. Answer these explicitly:

A) Does Canva Connect API officially support creating editable designs programmatically?

B) Does Canva Connect API support inserting text layers programmatically?

C) Does Canva Connect API support creating multi-page template documents?

D) Does Canva Connect API support generating "Use as Template" share links?

If ANY answer is no:
STOP current architecture.

Then pivot to supported Canva workflow.

Fallback architecture:
Instead of constructing editable designs manually,
use Canva Autofill / supported design population workflows.

Do not keep retrying malformed design creation requests.

Return exact Canva error details.