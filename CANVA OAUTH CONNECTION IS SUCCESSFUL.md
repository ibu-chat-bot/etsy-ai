CANVA OAUTH CONNECTION IS SUCCESSFUL.

DO NOT CHANGE AUTHENTICATION.

Current failure:
Canva returns HTTP 400 when attempting to create/open generated designs.

This means authentication works, but Canva API request payload is invalid.

FIX THE CANVA INTEGRATION IMPLEMENTATION.

Likely issue:
The current implementation is trying to create editable Canva templates using unsupported or malformed payload structure.

Required fixes:

1. Audit Canva API endpoints currently used.

2. Verify correct official Canva Connect API endpoints for:
- create design
- create asset
- import content
- editable design creation

3. Ensure payload matches Canva API schema exactly.

4. DO NOT generate fake mock design IDs like:
mock_design_xxxxx

Use real Canva design creation response IDs only.

5. Add detailed logging for Canva API responses:
status
endpoint
request payload
error body

6. If direct multi-page editable template creation is unsupported:
fallback strategy:

STEP A
Create Canva design first.

STEP B
Upload generated assets.

STEP C
Insert assets into design.

STEP D
Return preview/edit link.

7. Fix "Template Access Link" generation.
Currently links are invalid.

Only use official Canva-generated links.

8. Add error reporting UI:
show actual Canva API error response.

IMPORTANT:
Authentication works.
OAuth works.
Scopes work.

Problem is API implementation only.

Fix Canva design creation logic.