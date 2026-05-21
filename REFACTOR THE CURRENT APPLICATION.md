REFACTOR THE CURRENT APPLICATION.

Change the existing "Etsy Canva AI Production Studio" architecture into a LEAN internal production tool optimized for a single admin user.

DO NOT rebuild from scratch.

Refactor the existing codebase.

PRIMARY GOAL:
This tool is NOT responsible for generating final Canva templates, PDFs, mockups, ZIP asset packages, or storing large generated assets.

The admin (me) will manually:
- create Canva templates
- generate images manually
- create delivery PDFs manually
- create Etsy mockups manually
- upload final products manually

The application should become a strategic AI assistant for Etsy digital product production.

==================================================
REMOVE THESE MODULES COMPLETELY
==================================================

REMOVE:
- OpenAI image generation engine
- mockup generation engine
- PDF delivery generator
- ZIP export system
- asset storage for generated media
- generated asset database logic
- mockup database logic
- PDF export routes
- ZIP export routes
- image generation routes
- image storage logic
- heavy storage dependencies

DELETE related:
API routes
UI pages
components
database tables
storage integrations

==================================================
KEEP THESE MODULES
==================================================

KEEP:
- authentication
- dashboard
- project CRUD
- settings
- OpenAI API integration
- project history

==================================================
NEW APPLICATION PURPOSE
==================================================

This app is now an AI-powered Etsy Digital Product Strategy Studio.

Purpose:
Help a single admin rapidly plan, structure, and prepare Etsy digital products.

Final outputs should be strategic production assets, not finished design files.

==================================================
NEW CORE FEATURES
==================================================

1. PRODUCT IDEA GENERATOR

Input:
product niche
product type
target audience
style
language
template count

Generate:
- product concept
- value proposition
- bundle positioning
- naming ideas
- differentiation angle

--------------------------------------------------

2. ETSY NICHE ANALYZER

Generate:
- market opportunity summary
- likely customer intent
- competitor positioning insights
- product angle suggestions
- upsell opportunities

--------------------------------------------------

3. ETSY SEO GENERATOR

Generate:
- optimized Etsy title
- long description
- short description
- 13 Etsy tags
- keyword list
- FAQ
- feature bullets
- conversion hooks

--------------------------------------------------

4. CONTENT BLUEPRINT GENERATOR

Generate exact template structure for the admin to manually build in Canva.

Example output:

Template 1:
Promo offer
Layout:
headline top left
hero image right
CTA bottom center

Template 2:
Testimonial
Layout:
customer quote centered
portrait left
stars top

Template 3:
Before/after comparison
Layout:
split screen
headline top
CTA bottom

This module must be highly practical and exact.

--------------------------------------------------

5. CANVA LAYOUT PLANNER

Generate pixel-like implementation guidance for manual Canva building.

Example:

Canvas size:
1080x1080

Background:
#F7F3EE

Heading:
top 120px
font size 72
editorial serif

Hero image:
right aligned
480x650

CTA button:
bottom center
320x80

This helps the admin manually recreate templates quickly.

--------------------------------------------------

6. AI IMAGE PROMPT GENERATOR

Generate prompts only.

DO NOT generate images.

Outputs:
- hero image prompts
- background prompts
- product scene prompts
- character prompts
- object prompts

Compatible with ChatGPT image generation or other AI tools.

--------------------------------------------------

7. MOCKUP PROMPT GENERATOR

Generate prompts for manual mockup creation.

Example:
"premium Etsy listing mockup showing Instagram post bundle on iPhone screen with clean neutral desk setup"

Prompt generation only.

--------------------------------------------------

8. PRODUCT COPY GENERATOR

Generate:
- sales bullets
- benefit messaging
- CTA copy
- editable placeholder text suggestions
- product intro copy

--------------------------------------------------

9. SHOP BRANDING ASSISTANT

Generate:
- Etsy shop naming ideas
- shop bio
- banner copy
- profile description
- category naming suggestions

--------------------------------------------------

10. PROJECT EXPORT (TEXT ONLY)

Export only:
JSON
Markdown
TXT

No media exports.

==================================================
DATABASE REFACTOR
==================================================

REMOVE:
generated_assets table

REMOVE:
mockup asset tables

REMOVE:
pdf asset tables

ADD OR KEEP:

users
projects
seo_assets
visual_systems
content_blueprints
prompt_outputs
settings

prompt_outputs table:
id
project_id
prompt_type
content
created_at

==================================================
UI REFACTOR
==================================================

Dashboard should now focus on strategy.

Sections:

- New Product Strategy
- Project History
- SEO Generator
- Blueprint Generator
- Prompt Generator
- Branding Assistant
- Settings

REMOVE:
asset manager
media previews
mockup galleries
download ZIP center

==================================================
WORKFLOW
==================================================

NEW FLOW:

STEP 1
Admin enters product idea

STEP 2
AI generates market strategy

STEP 3
AI generates SEO package

STEP 4
AI generates Canva blueprint

STEP 5
AI generates exact layout implementation plan

STEP 6
AI generates image prompts

STEP 7
AI generates mockup prompts

STEP 8
AI generates listing copy

STEP 9
Admin manually creates assets outside the app

==================================================
UI STYLE
==================================================

Keep premium SaaS style.

Dark modern interface.

Fast response.

Minimal friction.

==================================================
IMPORTANT
==================================================

This is an INTERNAL TOOL for ONE ADMIN ONLY.

No public marketplace features.

No customer management.

No ecommerce checkout.

No digital delivery.

No final asset hosting.

Optimize for low operational cost and speed.

Refactor existing codebase cleanly.

Preserve architecture quality.