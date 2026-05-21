REFACTOR THE CURRENT APPLICATION INTO A FULL CANVA AUTOMATION SYSTEM.

DO NOT BUILD A STRATEGY-ONLY TOOL.

Transform the existing Etsy Digital Product Strategy Studio into a FULL AI-POWERED CANVA TEMPLATE GENERATOR for internal use.

PRIMARY GOAL:
I do NOT want to manually design templates in Canva.

The system must automatically generate editable Canva templates using Canva API integration.

This is an internal admin-only automation tool for producing Etsy digital products.

==================================================
NEW CORE PURPOSE
==================================================

User enters a product idea.

Example:
"Luxury Beauty Clinic Instagram Bundle"
"30 editable Instagram templates"
"Luxury style"

The application automatically:

- analyzes niche
- generates Etsy SEO
- creates design system
- generates layouts
- generates images
- builds editable Canva templates automatically
- creates multi-page Canva projects
- places text blocks
- places images
- applies colors
- applies typography
- generates CTA sections
- creates editable customer-ready template links

Final output:
A Canva editable template link ready for Etsy sale.

==================================================
CANVA API INTEGRATION REQUIRED
==================================================

Integrate Canva Developer API / Canva Connect API.

Required capabilities:

- authenticate Canva account
- connect admin Canva workspace
- create new Canva designs
- create multi-page designs
- insert text elements
- insert image elements
- apply layout positioning
- set font styles
- set colors
- duplicate template pages
- create editable template links

Admin flow:
Connect Canva account once.
Reuse connection.

==================================================
KEEP EXISTING FEATURES
==================================================

KEEP:
- auth
- dashboard
- project CRUD
- settings
- OpenAI integration
- SEO generation
- strategy generation
- blueprint generation

==================================================
ADD FULL AUTOMATION MODULES
==================================================

1. AI DESIGN ENGINE

Generate:
- design direction
- color palette
- typography
- composition rules
- layout hierarchy

Output must be machine-readable JSON.

Example:
{
  "canvas_size": "1080x1080",
  "background": "#F7F3EE",
  "font_heading": "Playfair Display",
  "font_body": "Inter",
  "templates": [...]
}

--------------------------------------------------

2. IMAGE GENERATION ENGINE

Use OpenAI image generation.

Generate all visual assets automatically.

Requirements:
high resolution
commercial quality
clean backgrounds
professional ecommerce aesthetic

Store temporary assets.

--------------------------------------------------

3. CANVA PROJECT BUILDER

This is the critical module.

Using Canva API:
automatically create designs.

Per template page:
- create page
- add background
- add text boxes
- add image placeholders
- upload generated images
- place images
- apply sizing
- apply spacing
- apply CTA buttons
- apply brand colors

Result:
editable Canva pages.

--------------------------------------------------

4. TEMPLATE LINK GENERATOR

Generate Canva editable share links.

Admin must receive:
"Use as template" link.

This is what will be sold on Etsy.

--------------------------------------------------

5. MULTI-PAGE TEMPLATE GENERATOR

If template count = 30

Automatically create:
30 Canva pages.

Each page unique.

Examples:
promo
testimonial
offer
before/after
review
quote
tips
service highlight

--------------------------------------------------

6. TEXT CONTENT ENGINE

Generate placeholder editable text.

Example:
"Your Clinic Name"
"Book Appointment"
"Special Offer"

All editable in Canva.

--------------------------------------------------

7. MOCKUP GENERATOR

Generate Etsy listing mockups automatically.

Use generated Canva pages.

Outputs:
phone mockups
desktop mockups
flatlay mockups

--------------------------------------------------

8. PDF DELIVERY GENERATOR

Generate Etsy customer PDF automatically.

Include:
thank you page
template access instructions
Canva link
usage steps

--------------------------------------------------

9. ZIP DELIVERY PACKAGE

Bundle:
PDF
mockups
listing copy
SEO package
template link references

==================================================
DATABASE UPDATES
==================================================

ADD:

canva_connections
id
user_id
access_token
refresh_token
workspace_id
created_at

----------------------------

canva_projects
id
project_id
canva_design_id
template_link
preview_link
created_at

----------------------------

generated_assets
id
project_id
asset_type
file_url
prompt_used
created_at

==================================================
API ROUTES
==================================================

POST /api/canva/connect
POST /api/canva/callback
GET /api/canva/status

POST /api/projects/:id/generate-images
POST /api/projects/:id/build-canva
POST /api/projects/:id/generate-template-link
POST /api/projects/:id/generate-mockups
POST /api/projects/:id/generate-pdf
POST /api/projects/:id/export-package

==================================================
WORKFLOW
==================================================

STEP 1
Admin logs in

STEP 2
Connect Canva account

STEP 3
Create product

STEP 4
AI strategy generation

STEP 5
AI SEO generation

STEP 6
AI design JSON generation

STEP 7
AI image generation

STEP 8
Auto Canva project creation

STEP 9
Auto multi-page template build

STEP 10
Generate editable template link

STEP 11
Generate Etsy mockups

STEP 12
Generate delivery PDF

STEP 13
Export product package

==================================================
UI CHANGES
==================================================

Dashboard must include:

- Connect Canva
- New Automated Product
- Active Generations
- Generated Template Links
- Exports

Project page:
tabs:
Overview
SEO
Design System
Canva Build
Mockups
PDF
Export

Canva Build tab:
status progress:
Connecting
Generating Images
Building Pages
Uploading Assets
Creating Template Link
Done

==================================================
TECH STACK
==================================================

Frontend:
Next.js
React
TypeScript
Tailwind

Backend:
Next.js API routes

Database:
Supabase

AI:
OpenAI GPT
OpenAI Images

Canva:
Official Canva Developer API

Storage:
Supabase storage

PDF:
pdf-lib

ZIP:
JSZip

==================================================
IMPORTANT
==================================================

This must be production-grade.

Do not use fake Canva integration.

Use official Canva API architecture.

All Canva templates must be editable.

This is internal use only.

Single admin only.

Goal:
I type product idea -> system returns ready-to-sell editable Canva template package.