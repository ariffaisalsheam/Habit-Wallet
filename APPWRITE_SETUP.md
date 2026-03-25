# HabitWallet Appwrite Setup

This project now uses Appwrite as the primary backend source for:
- profile
- subscriptions and admin approval
- habits and habit completions
- finance transactions and budgets

## Required Environment Variables

Set these in `web/.env.local`.

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=69c3a3f10011a71ec4dd
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_SITE_URL=https://habitwallet.afsbd.tech

NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID=subscriptions
NEXT_PUBLIC_APPWRITE_ADMIN_LOGS_COLLECTION_ID=admin_logs
NEXT_PUBLIC_APPWRITE_HABITS_COLLECTION_ID=habits
NEXT_PUBLIC_APPWRITE_HABIT_COMPLETIONS_COLLECTION_ID=habit_completions
NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID=transactions
NEXT_PUBLIC_APPWRITE_BUDGETS_COLLECTION_ID=budgets
NEXT_PUBLIC_APPWRITE_PLATFORM_CONFIG_COLLECTION_ID=platform_config
```

## Appwrite Sites Production Deployment

Target production domain:

- `habitwallet.afsbd.tech`

Target GitHub repository:

- `https://github.com/ariffaisalsheam/Habit-Wallet.git`

### Build settings for Appwrite Sites

- Framework: `Next.js`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`
- Output directory: `.next`
- Node.js runtime: `20.x` (recommended)

### Required environment variables in Appwrite Site

Copy values from local `.env.local` and set them in Appwrite Site variables:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
- `NEXT_PUBLIC_SITE_URL=https://habitwallet.afsbd.tech`
- `NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_ADMIN_LOGS_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_HABITS_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_HABIT_COMPLETIONS_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_TRANSACTIONS_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_BUDGETS_COLLECTION_ID`
- `NEXT_PUBLIC_APPWRITE_PLATFORM_CONFIG_COLLECTION_ID`

### Custom domain mapping

1. In Appwrite Console, open your Site settings and add domain `habitwallet.afsbd.tech`.
2. Add the DNS records Appwrite provides (typically `CNAME` and/or verification records).
3. Wait for verification and SSL issuance.
4. Re-deploy once domain is verified.

## Admin Authorization Model

Admin access is label-based.

- Add label `admin` to admin users in Appwrite Auth.
- Code checks this label before allowing review actions and admin listing.

## Database Collections

Create the following collections in `NEXT_PUBLIC_APPWRITE_DATABASE_ID`.

### 1) users
Document ID: user id (`account.$id`)

Attributes:
- `userId` string
- `email` string
- `name` string
- `phone` string
- `avatar` string
- `country` string
- `language` string
- `subscriptionTier` enum: `free`, `pro`
- `subscriptionEndDate` string (nullable date string)
- `createdAt` datetime string
- `updatedAt` datetime string

Indexes:
- `userId` unique
- `updatedAt`

### 2) subscriptions
Attributes:
- `userId` string
- `userName` string
- `userEmail` string
- `tier` enum: `pro`
- `amount` float
- `months` integer
- `method` enum: `bkash`
- `senderNumber` string
- `transactionId` string (unique)
- `status` enum: `pending`, `approved`, `rejected`
- `submittedAt` datetime string
- `reviewedAt` datetime string (nullable)
- `reviewedBy` string (nullable)
- `adminNote` string (nullable)

Indexes:
- `userId`
- `submittedAt`
- `status`
- `transactionId` unique

### 3) admin_logs
Attributes:
- `adminId` string
- `action` string
- `resourceType` string
- `resourceId` string
- `notes` string
- `createdAt` datetime string

Indexes:
- `adminId`
- `createdAt`

### 4) habits
Attributes:
- `userId` string
- `title` string
- `category` string
- `color` string
- `frequency` enum: `daily`, `weekly`, `custom`
- `timeBlock` enum: `morning`, `afternoon`, `evening`
- `targetDaysPerWeek` integer
- `isActive` boolean
- `createdAt` datetime string
- `updatedAt` datetime string

Indexes:
- `userId`
- `updatedAt`

### 5) habit_completions
Attributes:
- `userId` string
- `habitId` string
- `completionDate` string (`YYYY-MM-DD`)
- `completedAt` datetime string
- `notes` string
- `synced` boolean

Indexes:
- `userId`
- `habitId`
- `completedAt`
- composite unique: (`habitId`, `completionDate`)

### 6) transactions
Attributes:
- `userId` string
- `type` enum: `income`, `expense`
- `category` string
- `amount` float
- `currency` enum: `BDT`
- `date` string (`YYYY-MM-DD`)
- `description` string
- `created_at` datetime string
- `synced` boolean

Indexes:
- `userId`
- `date`
- `created_at`

### 7) budgets
Attributes:
- `userId` string
- `monthYear` string (`YYYY-MM`)
- `category` string
- `limitAmount` float
- `updatedAt` datetime string

Indexes:
- `userId`
- `monthYear`
- `updatedAt`
- composite unique: (`userId`, `monthYear`, `category`)

## Permissions Guidance

Use document-level user isolation:
- user-created docs should be readable and writable only by owner
- admin users should be able to review subscription docs and read admin logs

Practical setup:
1. default docs owner = current authenticated user
2. for admin operations, ensure admin users have permission to read/update subscription docs
3. keep admin logs non-public; readable only by admins

## Smoke Test Checklist

1. Register/login and open Profile, save profile settings.
2. Submit subscription request and confirm it appears in user list.
3. Log in as admin-labeled user and approve/reject request in Admin page.
4. Add/edit/delete habits and complete for today.
5. Add/edit/delete transactions and budgets.
6. Reload app and confirm synced data is restored from backend.
