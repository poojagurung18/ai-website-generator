AI Website Generator

A Next.js application that allows users to generate and customize websites using AI-powered tools.

Live Link: https://ai-website-generator-khaki.vercel.app/

Features:

AI Image Tools: Generate images from prompts and apply AI transformations (background removal, upscaling).

Workspace: A real-time playground to edit and preview website components.

Project Management: Save and organize multiple projects in a personal dashboard.

Auth & Credits: Secure login via Clerk and a credit-based system for AI usage.

Tech Stack:

Framework: Next.js 15

Authentication: Clerk

Database: PostgreSQL with Drizzle ORM

Images: ImageKit.io

UI: Tailwind CSS and Shadcn/UI

Local Setup

Clone the repo:

git clone https://github.com/poojagurung18/ai-website-generator.git

cd ai-website-generator

Install dependencies:

npm install

Environment Variables:

Create a .env.local file with the following keys:

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

CLERK_SECRET_KEY

DATABASE_URL

NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY

NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

IMAGEKIT_PRIVATE_KEY

