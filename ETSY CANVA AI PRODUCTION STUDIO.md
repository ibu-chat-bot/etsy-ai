# ETSY CANVA AI PRODUCTION STUDIO

## PROJECT OVERVIEW

Build a full automation internal SaaS tool for a single admin user (me) to create professional digital products for Etsy.

This is NOT a customer-facing marketplace.

This is an internal AI production studio that automates the full workflow of Etsy digital product creation.

The goal is to dramatically reduce the time required to create Canva-editable Etsy products.

Current manual workflow:
Idea → research → design concept → AI prompts → generate images → edit assets → create Canva templates → make mockups → write Etsy SEO listing → create delivery PDF → export assets → upload to Etsy.

Target workflow:
Single product idea input → complete ready-to-upload Etsy product package output.

---

# CORE GOAL

The system should fully automate:

- niche analysis
- product concept creation
- Etsy keyword research
- SEO listing generation
- AI image generation
- design system generation
- Canva asset preparation
- mockup generation
- delivery PDF creation
- ZIP export packaging

Final output must be Etsy-ready.

---

# TARGET USER

Single admin only.

No public users.

No customer login.

Only internal use.

Admin = me.

---

# PRODUCT NAME

Etsy Canva AI Production Studio

Alternative codename:
Template Forge AI

---

# PRIMARY USE CASE

Example input:

"Luxury Beauty Clinic Instagram Canva Bundle, 30 templates"

System automatically generates:

- market positioning
- product concept
- visual style direction
- color palette
- typography recommendation
- content structure
- individual design concepts
- AI prompts for all assets
- generated images
- social media layouts
- editable Canva asset package
- product mockups
- Etsy title
- Etsy description
- Etsy tags
- delivery PDF
- export ZIP

---

# MVP FEATURES

## FEATURE 1 — AUTH SYSTEM

Single admin authentication.

Requirements:
- secure login
- email/password auth
- session persistence
- protected routes
- logout

Suggested:
Supabase Auth

---

## FEATURE 2 — DASHBOARD

Dashboard must include:

- New Product button
- Project history
- Recent generations
- Asset library
- Export center
- Settings
- OpenAI API settings
- Canva export settings

Dashboard widgets:
- total projects
- generated images
- exported ZIPs
- active drafts

---

## FEATURE 3 — NEW PRODUCT GENERATOR

Input form:

Product Name
Example:
Luxury Beauty Instagram Bundle

Niche
Dropdown:
- Beauty
- Real Estate
- Fitness
- Wedding
- Kids
- Food
- Education
- Fashion
- Spa
- Medical
- Restaurant
- Social Media
- Business

Product Type
Dropdown:
- Instagram Post Pack
- Story Bundle
- Invitation
- Planner
- Ebook Template
- Price List
- Presentation
- Flyer
- Menu
- Media Kit

Style
Dropdown:
- Luxury
- Minimal
- Futuristic
- Cute
- Corporate
- Elegant
- Modern
- Editorial
- Dark Premium

Language
Dropdown:
- English
- Turkish

Template Count
Number input

Aspect Ratio
Dropdown:
- 1080x1080
- 1080x1920
- A4
- US Letter
- Presentation

Generate Button

---

# FEATURE 4 — AI PRODUCT STRATEGIST

AI analyzes product idea.

Output:

- niche opportunity summary
- target audience
- market positioning
- competitor angle
- design opportunity
- value proposition

Prompt logic:

"Analyze Etsy digital product market for this product category and produce commercial positioning."

---

# FEATURE 5 — ETSY SEO GENERATOR

Generate:

SEO title
SEO description
13 Etsy tags
keywords
search phrases

Rules:
optimized for Etsy
high CTR
high conversion
natural language

Outputs:

title
description
tags
FAQ copy
features list

---

# FEATURE 6 — VISUAL DIRECTION ENGINE

Generate:

brand identity direction

Output:

- color palette
- typography recommendations
- visual mood
- composition style
- design language
- CTA style
- spacing system

Example:

Luxury aesthetic
white + gold + beige
editorial typography
high-end beauty clinic layout

---

# FEATURE 7 — CONTENT BLUEPRINT ENGINE

Generate structure for each design.

Example:

Template 1:
Promo post

Template 2:
Offer post

Template 3:
Testimonial

Template 4:
Before after

Template 5:
Service highlight

etc.

For each:
- content purpose
- layout structure
- text hierarchy
- CTA placement

---

# FEATURE 8 — AI IMAGE GENERATION ENGINE

Generate all visual assets automatically.

Use OpenAI image generation.

Requirements:
high resolution
commercial style
clean background
premium composition

Inputs:
style
niche
product type

Example prompt:

"Luxury beauty clinic promotional composition, clean editorial aesthetic, premium skincare visuals, soft lighting, minimal background"

Outputs:
PNG assets

Storage:
project asset folder

---

# FEATURE 9 — MOCKUP GENERATOR

Generate Etsy mockups automatically.

Mockup types:
- laptop
- phone
- desktop
- framed print
- instagram feed preview
- story preview

Outputs:
marketing mockup images

Requirements:
clean ecommerce quality
professional
high conversion style

---

# FEATURE 10 — CANVA EXPORT PREP

System prepares Canva-ready assets.

Outputs:
organized folder structure

Example:

/project-name
/assets
/images
/mockups
/pdf
/copy
/seo

Image naming:
post-01.png
post-02.png

Transparent assets if needed.

---

# FEATURE 11 — DELIVERY PDF GENERATOR

Generate customer PDF.

PDF includes:

Thank you page
Download instructions
Canva access instructions
Editable notice
Support note

Template text:

"Thank you for your purchase"

"Click the Canva link below"

"Create a free Canva account if needed"

"Customize your template"

"Download PNG/PDF"

PDF export required.

---

# FEATURE 12 — ZIP EXPORT SYSTEM

Generate downloadable ZIP package.

Include:

generated images
mockups
delivery PDF
SEO listing text
tags
copy assets

ZIP naming:

luxury-beauty-instagram-bundle-v1.zip

---

# FEATURE 13 — PROJECT HISTORY

Store projects.

Fields:
- name
- niche
- style
- status
- created date
- updated date

Actions:
- reopen
- duplicate
- regenerate
- export
- delete

---

# FEATURE 14 — REGENERATE SYSTEM

Allow regenerating:

SEO only
images only
mockups only
PDF only
full project

---

# DATABASE SCHEMA

## TABLE: users

id
email
password_hash
created_at

---

## TABLE: projects

id
user_id
name
niche
product_type
style
language
template_count
aspect_ratio
status
created_at
updated_at

---

## TABLE: seo_assets

id
project_id
title
description
tags
keywords
faq
features

---

## TABLE: visual_systems

id
project_id
color_palette
typography
design_direction
layout_rules

---

## TABLE: content_blueprints

id
project_id
template_number
purpose
layout_structure
cta
text_hierarchy

---

## TABLE: generated_assets

id
project_id
asset_type
file_url
prompt_used
created_at

asset_type:
image
mockup
pdf
zip

---

## TABLE: settings

id
user_id
openai_api_key
brand_defaults
default_language

---

# API ENDPOINTS

POST /api/auth/login

POST /api/projects/create

GET /api/projects

GET /api/projects/:id

DELETE /api/projects/:id

POST /api/projects/:id/seo

POST /api/projects/:id/visual-system

POST /api/projects/:id/content-blueprint

POST /api/projects/:id/generate-images

POST /api/projects/:id/generate-mockups

POST /api/projects/:id/generate-pdf

POST /api/projects/:id/export-zip

POST /api/projects/:id/regenerate

---

# UI SCREENS

## LOGIN PAGE

Fields:
email
password

button:
login

---

## DASHBOARD PAGE

Cards:
New Product
Projects
Assets
Exports
Settings

Recent activity feed

---

## NEW PROJECT PAGE

Step 1:
Product details

Step 2:
Strategy generation

Step 3:
SEO generation

Step 4:
Visual system

Step 5:
Blueprint generation

Step 6:
Image generation

Step 7:
Mockups

Step 8:
PDF

Step 9:
Export

---

## PROJECT DETAIL PAGE

Sections:
Overview
SEO
Visual System
Blueprints
Assets
Mockups
PDF
ZIP Export

Buttons:
Regenerate
Duplicate
Delete

---

## SETTINGS PAGE

Fields:
OpenAI API key
default language
default brand settings

---

# TECH STACK

Frontend:
Next.js
React
TypeScript
Tailwind
shadcn/ui

Backend:
Next.js API routes

Database:
Supabase PostgreSQL

Auth:
Supabase Auth

Storage:
Supabase Storage

AI:
OpenAI GPT
OpenAI Images

PDF:
pdf-lib

ZIP:
JSZip

Deployment:
Vercel

---

# FOLDER STRUCTURE

/app
/dashboard
/projects
/settings
/api

/components
/ui
/forms
/cards
/generators

/lib
/openai
/pdf
/zip
/storage
/db

/types

/prompts

---

# AUTOMATION WORKFLOW

STEP 1
admin creates project

STEP 2
save project

STEP 3
run strategist AI

STEP 4
run SEO AI

STEP 5
run visual direction AI

STEP 6
run blueprint AI

STEP 7
generate images

STEP 8
generate mockups

STEP 9
generate PDF

STEP 10
package ZIP

STEP 11
show export ready

---

# OPENAI PROMPT SYSTEM

Separate prompt modules required.

prompts:

seo-generator.ts
visual-direction.ts
content-blueprint.ts
market-strategy.ts
image-prompts.ts

---

# BUILD ORDER

PHASE 1
Auth
Dashboard
Project CRUD

PHASE 2
AI strategy
SEO generator

PHASE 3
visual engine
blueprint engine

PHASE 4
image generation

PHASE 5
mockup engine

PHASE 6
PDF export

PHASE 7
ZIP export

PHASE 8
polish UI

---

# UI STYLE

Premium SaaS aesthetic.

Look inspiration:
Linear
Vercel
Framer
Notion AI

Design rules:
clean spacing
large cards
glass panels
dark mode
smooth animations

---

# IMPORTANT CONSTRAINTS

Internal tool only

No customer frontend

No ecommerce checkout

No public marketplace

Single admin use

Fast workflow priority

Professional output priority

---

# ANTI-GRAVITY BUILD INSTRUCTION

Build this exact application step by step.

Do not simplify architecture.

Start with authentication and dashboard.

Then implement project CRUD.

Then implement AI modules one by one.

After each module, verify functionality before proceeding.

Use production-ready code.

Use TypeScript.

Use reusable components.

Maintain clean architecture.

Do not skip API integration.

Do not use placeholder logic for final modules.

Generate complete working implementation.

END