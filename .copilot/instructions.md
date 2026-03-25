# HabitWallet - Development Instructions

## Project Overview
- **Type**: Full-Stack Web Application
- **Framework**: Next.js (React + Node.js)
- **Backend**: Appwrite (Auth, Databases, Storage, Cloud Functions, Messaging)
- **Status**: Starting fresh

## Branding Rules (Always Enforce)
- **Official App Name**: HabitWallet
- **Official Logo Directory**: `web/public/logo/`
- **High-Resolution Preference**: Use `web/public/logo/android-chrome-512x512.png` as the source logo in UI placements to avoid pixelation.
- **Icon Usage**: Use only official files from `web/public/logo/` for favicon, Apple touch icon, and PWA manifest icons.
- **Do Not** introduce alternate app names or unofficial logo files unless explicitly requested.

## Appwrite Configuration
- **Project ID**: `69c3a3f10011a71ec4dd`
- **API Endpoint**: `https://sgp.cloud.appwrite.io/v1`
- **API Key**: standard_21208d0492a7e0c1810aab129cde25e803d5f30019e61e12f027084ffa44168ef628e30cb51388deb7d0072cb5aac9182efbf30cca3c887c7c51b62c9dcd8c5226d06e27a3091e74e893026f3d38373f0c572e4c6b6c5182b6c6b9ee4951ea9af371da1f503981daae25bdf8767935833ba2f5cf131cba7b5491fbf16d9fa294

## Core Development Principles

### 1. Never Guess - Always Analyze
- **Always** explore the project structure before implementing changes
- If unclear about architecture, patterns, or requirements → **Ask first**
- Use semantic_search or file_search to understand existing patterns
- Review CHANGELOG.md before making changes to understand project context

### 2. Appwrite Integration Guidelines
- **Use Appwrite CLI** for:
  - Database collection setup and management
  - Function deployment and management
  - Environment variable configuration
  - Storage bucket creation
  
- **Use Appwrite MCP Server** for:
  - Retrieving documentation and examples
  - Understanding API features and capabilities
  - Getting code examples for specific features
  
- **Guidance for Backend Issues**:
  - If you encounter Appwrite-related problems, I will guide you through solutions
  - You will handle actual credential/setup work; I'll provide step-by-step instructions

### 3. Code Organization Standards
```
habit-finance-tracker/
├── .instructions.md          # This file
├── CHANGELOG.md              # Required - all changes logged here
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── components/               # React components
│   ├── auth/                 # Authentication components
│   ├── dashboard/            # Dashboard-related
│   ├── habits/               # Habit tracking UI
│   └── finance/              # Finance tracking UI
├── lib/                      # Utility functions
│   ├── appwrite.ts          # Appwrite client setup
│   ├── auth.ts              # Authentication utilities
│   └── hooks/               # Custom React hooks
├── public/                   # Static files
├── styles/                   # Global styles
├── functions/                # Appwrite Cloud Functions
├── .env.local                # Local environment variables (DO NOT COMMIT)
├── .env.example              # Example env file (commit this)
└── package.json
```

### 4. Changelog Maintenance (CRITICAL)
**Every change must be logged in CHANGELOG.md**. Format:
```markdown
## [Date] - [Change Type]
- **File(s)**: path/to/file.ts
- **Description**: What was changed and why
- **Type**: Feature | Bug Fix | Refactor | Docs | Setup

---
```

### 5. Appwrite Feature Usage
- **Authentication**: Use Appwrite Auth for user registration/login
- **Databases**: Create collections for habits, finances, goals, etc.
- **Storage**: Store user documents/receipts/attachments
- **Cloud Functions**: Handle complex backend logic, cron jobs for habit reminders
- **Messaging**: Send notifications for habit streaks, financial alerts

### 6. Development Workflow
1. **Analyze**: Explore codebase structure and requirements
2. **Plan**: Document planned changes in a comment or ask for confirmation
3. **Implement**: Make changes and update files
4. **Log**: Update CHANGELOG.md immediately
5. **Test**: Verify changes work as expected
6. **Commit**: With clear messages referencing CHANGELOG entries

### 7. File Conventions
- **Component Files**: Use `.tsx` for React components with TypeScript
- **API Routes**: Use TypeScript (`route.ts`)
- **Environment Variables**: Define in `.env.example` for documentation
- **Appwrite Functions**: Name clearly, document parameters and return types

### 8. API Integration Pattern
```typescript
// lib/appwrite.ts example structure
import { Client, Databases, Auth, Storage, Functions } from 'appwrite';

export const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
```

### 9. When to Ask for Clarification
Ask me these questions if unclear:
- **About architecture**: "Should this feature use [approach A] or [approach B]?"
- **About Appwrite setup**: "How should we structure the [collection/function/bucket]?"
- **About conventions**: "Does this follow the project's pattern for [feature]?"
- **About priorities**: "Should I prioritize [task A] or [task B]?"

---

## Quick Reference: Tool Usage
- **Backend Integration**: Appwrite CLI commands guided by me
- **Documentation Lookup**: Appwrite Docs MCP Server
- **Code Analysis**: Semantic search of codebase
- **File Operations**: Direct file creation/editing with logging
- **Problem Solving**: Analyze → Ask → Implement → Log

---

**Created**: March 25, 2026
**Last Updated**: March 25, 2026
