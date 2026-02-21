ARCHITECTURE.MD - Virtual Try-On Platform
Project Name: VirtualFit
Version: 1.0.0
Last Updated: 2026-02-08
Tech Stack: Next.js 14, TypeScript, Supabase, Vercel

TABLE OF CONTENTS

Project Overview
System Architecture
Tech Stack Details
Database Schema
API Endpoints
File Structure
Environment Variables
Installation & Setup
Development Workflow
Deployment Guide
Feature Specifications
Security & Performance
Error Handling
Monitoring & Logging
Maintenance & Scaling


1. PROJECT OVERVIEW
1.1 Product Description
A web application that allows users to upload their full-body photo and visualize how clothing products look on them using AI-powered virtual try-on technology.
1.2 Core Features (MVP)

✅ User authentication (email/password, Google OAuth)
✅ Photo upload with validation
✅ Product catalog (initially hardcoded, DB-backed later)
✅ AI-powered virtual try-on generation
✅ Try-on history/gallery
✅ Image download/sharing
✅ Rate limiting (10 try-ons per day for free users)
✅ Responsive design (mobile-first)

1.3 User Flow
1. User signs up/logs in
2. User uploads full-body photo (stored permanently in their profile)
3. User browses product catalog
4. User selects a product → clicks "Try On"
5. System queues job → calls Replicate API
6. User sees loading state (10-30 seconds)
7. Result displayed → user can download/share
8. Result saved to gallery for future reference
1.4 Success Metrics

Time to first try-on: < 60 seconds from signup
API response time: < 30 seconds for try-on generation
Mobile usability: 100% responsive
Uptime: 99.9%


2. SYSTEM ARCHITECTURE
2.1 High-Level Architecture Diagram
┌─────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE CDN                        │
│                    (DDoS Protection + Cache)                 │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                     │
│                   (Global Load Balancing)                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                ┏────────────┴────────────┓
                ▼                         ▼
    ┌──────────────────────┐  ┌──────────────────────┐
    │   NEXT.JS FRONTEND   │  │  NEXT.JS API ROUTES  │
    │   (React Components) │  │   (Serverless)       │
    │                      │  │                      │
    │  - Auth UI           │  │  - /api/auth/*       │
    │  - Upload UI         │  │  - /api/upload       │
    │  - Gallery           │  │  - /api/tryon        │
    │  - Product Catalog   │  │  - /api/products     │
    └──────────────────────┘  └──────────┬───────────┘
                                         │
                    ┏────────────────────┼────────────────────┓
                    ▼                    ▼                    ▼
        ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
        │   SUPABASE       │ │  UPSTASH REDIS   │ │  REPLICATE API   │
        │                  │ │                  │ │                  │
        │ - PostgreSQL     │ │ - Session Cache  │ │ - IDM-VTON Model │
        │ - Auth           │ │ - Rate Limiting  │ │ - Image Gen      │
        │ - Storage (imgs) │ │ - Job Queue      │ │                  │
        │ - Realtime       │ │                  │ │                  │
        └──────────────────┘ └──────────────────┘ └──────────────────┘
2.2 Data Flow - Try-On Generation
┌──────────┐
│  User    │
└────┬─────┘
     │ 1. Selects product
     ▼
┌──────────────────┐
│  Frontend        │
│  (Product Page)  │
└────┬─────────────┘
     │ 2. POST /api/tryon
     │    { productId, userPhotoUrl }
     ▼
┌──────────────────┐
│  API Route       │
│  /api/tryon      │
└────┬─────────────┘
     │ 3. Validate user credits
     │ 4. Check rate limit (Redis)
     │ 5. Create DB record (status: queued)
     ▼
┌──────────────────┐
│  Replicate API   │
│  (Async Call)    │
└────┬─────────────┘
     │ 6. POST to Replicate
     │    Returns prediction_id
     ▼
┌──────────────────┐
│  Webhook Handler │
│  /api/webhook    │
└────┬─────────────┘
     │ 7. Replicate calls back when done
     │ 8. Update DB (status: completed, resultUrl)
     │ 9. Trigger Supabase Realtime event
     ▼
┌──────────────────┐
│  Frontend        │
│  (Realtime Sub)  │
└────┬─────────────┘
     │ 10. Listens to DB changes
     │ 11. Displays result image
     ▼
┌──────────┐
│  User    │
│ (Sees    │
│  Result) │
└──────────┘
2.3 Component Interaction
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Auth    │  │  Upload  │  │  Gallery │             │
│  │  Pages   │  │  Component│ │  Page    │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        │ useAuth()   │ useTryOn()  │ useGallery()
        │             │             │
┌───────┼─────────────┼─────────────┼────────────────────┐
│       ▼             ▼             ▼   HOOKS LAYER      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ useAuth  │  │useTryOn  │  │useGallery│             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        │ fetch()     │ fetch()     │ Supabase.from()
        │             │             │
┌───────┼─────────────┼─────────────┼────────────────────┐
│       ▼             ▼             ▼   API LAYER        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │/api/auth │  │/api/tryon│  │ Supabase │             │
│  │          │  │          │  │ Client   │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
└───────┼─────────────┼─────────────┼────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────┐
│               EXTERNAL SERVICES LAYER                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Supabase │  │ Replicate│  │  Upstash │             │
│  │   Auth   │  │   API    │  │   Redis  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────┘

3. TECH STACK DETAILS
3.1 Frontend Stack
TechnologyVersionPurposeWhy This ChoiceNext.js14.2.xReact frameworkApp Router, Server Components, API routes, optimized buildsTypeScript5.4.xType safetyCatch errors at compile time, better DXReact18.3.xUI libraryIncluded with Next.jsTailwind CSS3.4.xStylingUtility-first, fast developmentshadcn/uiLatestComponent libraryAccessible, customizable, Tailwind-basedLucide ReactLatestIconsLightweight, tree-shakeableReact Hook Form7.51.xForm handlingPerformant, minimal re-rendersZod3.23.xValidationType-safe schema validationTanStack Query5.xData fetchingCaching, optimistic updates, refetching
3.2 Backend Stack
TechnologyVersionPurposeWhy This ChoiceNext.js API Routes14.2.xServerless functionsCo-located with frontend, auto-scalingSupabaseLatestDatabase + Auth + StorageManaged Postgres, real-time, generous free tierPrisma5.xORMType-safe queries, migrations, introspectionUpstash RedisLatestCaching + Rate limitingServerless Redis, pay-per-requestReplicateLatestAI APIVirtual try-on models, pay-per-use
3.3 DevOps & Tooling
TechnologyVersionPurposeVercelLatestHosting + CI/CDGitHub-Version controlESLint8.xLintingPrettier3.xCode formattingHusky9.xGit hooksSentryLatestError trackingVercel AnalyticsLatestWeb vitals
3.4 External Services
ServicePurposePricing (Free Tier)SupabaseDatabase, Auth, Storage500MB DB, 1GB storage, 50K MAUUpstash RedisCache, Rate limiting10K requests/dayReplicateAI processingPay-per-use (~$0.01/image)VercelHosting100GB bandwidth, unlimited buildsCloudflareDNS + CDN (optional)Free plan availableSentryError tracking5K errors/month

4. DATABASE SCHEMA
4.1 Database Choice

Primary DB: PostgreSQL 15+ (via Supabase)
Reasoning: ACID compliance, JSONB support, full-text search, mature ecosystem

4.2 Schema Design (Prisma Schema)
prisma// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // For migrations
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  
  // Supabase Auth integration
  supabaseId    String    @unique // Links to Supabase auth.users.id
  
  // User photo (stored permanently)
  userPhotoUrl  String?   // Full-body photo for try-ons
  
  // Credits & limits
  credits       Int       @default(10) // Free credits
  planType      String    @default("free") // free, pro, enterprise
  
  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  tryOns        TryOn[]
  
  @@index([email])
  @@index([supabaseId])
}

// ============================================================================
// PRODUCTS (Clothing Items)
// ============================================================================

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String   // shirt, dress, pants, jacket, etc.
  gender      String   // male, female, unisex
  
  // Image URLs
  imageUrl    String   // Main product image (on white bg, front view)
  thumbnail   String?  // Thumbnail for catalog
  
  // Metadata (flexible JSON)
  metadata    Json?    // { brand, color, size, material, etc. }
  
  // Status
  isActive    Boolean  @default(true)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tryOns      TryOn[]
  
  @@index([category, gender])
  @@index([isActive])
}

// ============================================================================
// TRY-ON JOBS
// ============================================================================

model TryOn {
  id              String   @id @default(cuid())
  
  // User reference
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Product reference
  productId       String
  product         Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  // Image URLs
  userPhotoUrl    String   // Input: user's photo
  productImageUrl String   // Input: product image
  resultUrl       String?  // Output: AI-generated result
  
  // Processing status
  status          String   @default("queued") // queued, processing, completed, failed
  
  // Replicate tracking
  replicateId     String?  @unique // Prediction ID from Replicate
  
  // Performance metrics
  processingTimeMs Int?    // Time taken to generate
  
  // Error handling
  errorMessage    String?  // If status = failed
  retryCount      Int      @default(0)
  
  // Timestamps
  createdAt       DateTime @default(now())
  completedAt     DateTime?
  
  @@index([userId, createdAt(sort: Desc)]) // For user gallery
  @@index([status]) // For job queue processing
  @@index([replicateId]) // For webhook lookups
}

// ============================================================================
// RATE LIMITING (backup to Redis)
// ============================================================================

model RateLimit {
  id          String   @id @default(cuid())
  userId      String
  endpoint    String   // /api/tryon, /api/upload, etc.
  requestCount Int     @default(1)
  windowStart DateTime @default(now())
  
  @@unique([userId, endpoint, windowStart])
  @@index([userId, endpoint])
}

// ============================================================================
// ANALYTICS (Optional - can use Vercel Analytics instead)
// ============================================================================

model Event {
  id          String   @id @default(cuid())
  userId      String?
  eventName   String   // tryon_started, tryon_completed, photo_uploaded, etc.
  metadata    Json?
  createdAt   DateTime @default(now())
  
  @@index([eventName, createdAt])
  @@index([userId, createdAt])
}
4.3 Database Indexes
Critical indexes for performance:
sql-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_supabase_id ON users(supabase_id);

-- Try-on gallery queries (most common)
CREATE INDEX idx_tryons_user_created ON tryons(user_id, created_at DESC);

-- Job queue processing
CREATE INDEX idx_tryons_status ON tryons(status) WHERE status IN ('queued', 'processing');

-- Webhook lookups
CREATE INDEX idx_tryons_replicate_id ON tryons(replicate_id);

-- Product catalog
CREATE INDEX idx_products_category_gender ON products(category, gender) WHERE is_active = true;
4.4 Row Level Security (RLS) Policies
Supabase RLS policies for security:
sql-- Users can only read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = supabase_id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = supabase_id);

-- Users can only view their own try-ons
CREATE POLICY "Users can view own tryons"
  ON tryons FOR SELECT
  USING (auth.uid() = (SELECT supabase_id FROM users WHERE id = user_id));

CREATE POLICY "Users can create tryons"
  ON tryons FOR INSERT
  WITH CHECK (auth.uid() = (SELECT supabase_id FROM users WHERE id = user_id));

-- Products are public (read-only)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);
4.5 Database Migrations
Migration workflow:
bash# Create migration
npx prisma migrate dev --name add_tryons_table

# Apply to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

5. API ENDPOINTS
5.1 Authentication Endpoints
POST /api/auth/signup
Purpose: Create new user account
Request:
typescript{
  email: string;      // Valid email
  password: string;   // Min 8 chars, 1 uppercase, 1 number
  name?: string;      // Optional display name
}
Response (200):
typescript{
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}
Errors:

400 - Invalid email/password format
409 - Email already exists
500 - Server error


POST /api/auth/login
Purpose: User login
Request:
typescript{
  email: string;
  password: string;
}
Response (200):
typescript{
  user: { id, email, name };
  session: { accessToken, refreshToken, expiresAt };
}
```

**Errors:**
- `401` - Invalid credentials
- `500` - Server error

---

#### POST `/api/auth/logout`
**Purpose:** Invalidate session

**Headers:**
```
Authorization: Bearer <accessToken>
Response (200):
typescript{
  message: "Logged out successfully"
}
```

---

#### GET `/api/auth/me`
**Purpose:** Get current user profile

**Headers:**
```
Authorization: Bearer <accessToken>
Response (200):
typescript{
  id: string;
  email: string;
  name: string | null;
  userPhotoUrl: string | null;
  credits: number;
  planType: string;
  createdAt: string;
}
```

**Errors:**
- `401` - Not authenticated
- `404` - User not found

---

### 5.2 Upload Endpoints

#### POST `/api/upload/user-photo`
**Purpose:** Upload user's full-body photo

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
Request:
typescriptFormData {
  photo: File; // JPEG/PNG, max 10MB, min 800x1200px
}
Response (200):
typescript{
  url: string;        // Supabase Storage URL
  width: number;      // Image dimensions
  height: number;
}
Validation:

File type: image/jpeg, image/png, image/webp
Max size: 10MB
Min dimensions: 800x1200 (portrait orientation required)
Face detection: Must contain visible person (optional but recommended)

Errors:

400 - Invalid file type/size/dimensions
401 - Not authenticated
413 - File too large
500 - Upload failed

Implementation Notes:
typescript// Pseudo-code
1. Validate file type & size
2. Generate unique filename (userId_timestamp.ext)
3. Upload to Supabase Storage bucket "user-photos"
4. Update user.userPhotoUrl in database
5. Return public URL

5.3 Product Endpoints
GET /api/products
Purpose: Get product catalog
Query Params:
typescript{
  category?: string;    // shirt, dress, pants, etc.
  gender?: string;      // male, female, unisex
  limit?: number;       // Default: 20, max: 100
  offset?: number;      // Pagination
}
Response (200):
typescript{
  products: [
    {
      id: string;
      name: string;
      description: string | null;
      category: string;
      gender: string;
      imageUrl: string;
      thumbnail: string;
      metadata: object;
    }
  ],
  total: number;
  hasMore: boolean;
}

GET /api/products/:id
Purpose: Get single product details
Response (200):
typescript{
  id: string;
  name: string;
  description: string | null;
  category: string;
  gender: string;
  imageUrl: string;
  thumbnail: string;
  metadata: {
    brand?: string;
    color?: string;
    material?: string;
    [key: string]: any;
  };
}
```

**Errors:**
- `404` - Product not found

---

### 5.4 Try-On Endpoints

#### POST `/api/tryon`
**Purpose:** Generate virtual try-on

**Headers:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
Request:
typescript{
  productId: string;  // Product to try on
}
Response (202 Accepted):
typescript{
  tryOnId: string;        // Job ID for tracking
  status: "queued";
  estimatedTime: number;  // Seconds (typically 10-30)
  message: "Try-on queued for processing"
}
```

**Processing Flow:**
```
1. Validate user has credits
2. Check rate limit (10/day for free users)
3. Retrieve user.userPhotoUrl (must exist)
4. Retrieve product.imageUrl
5. Create TryOn record (status: queued)
6. Call Replicate API asynchronously
7. Return 202 with tryOnId
8. Client polls /api/tryon/:id for status
   OR subscribes to Supabase Realtime
```

**Errors:**
- `400` - Missing userPhotoUrl (user must upload photo first)
- `401` - Not authenticated
- `402` - Insufficient credits
- `404` - Product not found
- `429` - Rate limit exceeded
- `500` - Server error

---

#### GET `/api/tryon/:id`
**Purpose:** Get try-on status and result

**Headers:**
```
Authorization: Bearer <accessToken>
Response (200):
typescript{
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  userPhotoUrl: string;
  productImageUrl: string;
  resultUrl: string | null;  // Available when status = completed
  processingTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}
Errors:

401 - Not authenticated
403 - Not authorized (not your try-on)
404 - Try-on not found


POST /api/webhook/replicate
Purpose: Webhook for Replicate completion
Security: Validate Replicate signature
Request:
typescript{
  id: string;           // Replicate prediction ID
  status: string;       // succeeded, failed
  output: string | null; // Result image URL
  error: string | null;
}
```

**Processing:**
```
1. Find TryOn by replicateId
2. Update status & resultUrl
3. Set completedAt timestamp
4. Calculate processingTimeMs
5. Trigger Supabase Realtime update (optional)
6. Return 200 OK
Response (200):
typescript{
  message: "Webhook processed"
}
```

---

### 5.5 Gallery Endpoints

#### GET `/api/gallery`
**Purpose:** Get user's try-on history

**Headers:**
```
Authorization: Bearer <accessToken>
Query Params:
typescript{
  limit?: number;   // Default: 20
  offset?: number;
  status?: string;  // Filter by status
}
Response (200):
typescript{
  tryOns: [
    {
      id: string;
      product: {
        id: string;
        name: string;
        imageUrl: string;
      };
      resultUrl: string | null;
      status: string;
      createdAt: string;
    }
  ],
  total: number;
  hasMore: boolean;
}
```

---

#### DELETE `/api/gallery/:id`
**Purpose:** Delete try-on from history

**Headers:**
```
Authorization: Bearer <accessToken>
Response (200):
typescript{
  message: "Try-on deleted successfully"
}
Errors:

403 - Not authorized
404 - Try-on not found


5.6 Rate Limiting Strategy
Implementation: Upstash Redis + sliding window
Limits:
typescriptconst RATE_LIMITS = {
  free: {
    tryons: { limit: 10, window: '24h' },
    uploads: { limit: 5, window: '24h' },
  },
  pro: {
    tryons: { limit: 100, window: '24h' },
    uploads: { limit: 50, window: '24h' },
  },
};
Algorithm:
typescript// Pseudo-code for /api/tryon rate limiting
const key = `ratelimit:tryon:${userId}`;
const limit = user.planType === 'pro' ? 100 : 10;
const window = 24 * 60 * 60; // 24 hours in seconds

const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, window);
}

if (count > limit) {
  return res.status(429).json({
    error: 'Rate limit exceeded',
    limit,
    resetAt: Date.now() + (await redis.ttl(key)) * 1000,
  });
}

// Proceed with try-on generation
```

---

## 6. FILE STRUCTURE

### 6.1 Project Root Structure
```
virtualfit/
├── .github/
│   └── workflows/
│       └── ci.yml                 # GitHub Actions (lint, type-check)
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # SQL migrations
│   └── seed.ts                    # Sample data (products)
├── public/
│   ├── favicon.ico
│   ├── og-image.png               # Social sharing image
│   └── sample-products/           # Placeholder product images
│       ├── shirt-1.jpg
│       ├── dress-1.jpg
│       └── ...
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/           # Protected route group
│   │   │   ├── layout.tsx         # Dashboard layout (sidebar, header)
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   ├── upload/
│   │   │   │   └── page.tsx       # Upload user photo
│   │   │   ├── products/
│   │   │   │   ├── page.tsx       # Product catalog
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # Product detail + try-on
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx       # Try-on history
│   │   │   └── settings/
│   │   │       └── page.tsx       # User settings
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── signup/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── logout/
│   │   │   │   │   └── route.ts
│   │   │   │   └── me/
│   │   │   │       └── route.ts
│   │   │   ├── upload/
│   │   │   │   └── user-photo/
│   │   │   │       └── route.ts
│   │   │   ├── products/
│   │   │   │   ├── route.ts       # GET /api/products
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET /api/products/:id
│   │   │   ├── tryon/
│   │   │   │   ├── route.ts       # POST /api/tryon
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # GET /api/tryon/:id
│   │   │   ├── gallery/
│   │   │   │   ├── route.ts       # GET /api/gallery
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts   # DELETE /api/gallery/:id
│   │   │   └── webhook/
│   │   │       └── replicate/
│   │   │           └── route.ts   # POST /api/webhook/replicate
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page (public)
│   │   ├── globals.css            # Global styles
│   │   └── error.tsx              # Global error boundary
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── AuthGuard.tsx      # Protected route wrapper
│   │   ├── upload/
│   │   │   ├── ImageUpload.tsx    # Drag-drop upload
│   │   │   └── PhotoPreview.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── ProductFilter.tsx
│   │   ├── tryon/
│   │   │   ├── TryOnButton.tsx
│   │   │   ├── TryOnResult.tsx
│   │   │   └── ProcessingState.tsx
│   │   ├── gallery/
│   │   │   ├── GalleryGrid.tsx
│   │   │   └── GalleryItem.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server.ts          # Server client
│   │   │   └── middleware.ts      # Auth middleware
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── redis.ts               # Upstash Redis client
│   │   ├── replicate.ts           # Replicate API wrapper
│   │   ├── validations.ts         # Zod schemas
│   │   └── utils.ts               # Utility functions
│   ├── hooks/
│   │   ├── useAuth.ts             # Auth state management
│   │   ├── useTryOn.ts            # Try-on mutation + polling
│   │   ├── useGallery.ts          # Gallery queries
│   │   └── useProducts.ts         # Product queries
│   ├── types/
│   │   ├── api.ts                 # API request/response types
│   │   ├── database.ts            # Prisma-generated types
│   │   └── index.ts
│   └── config/
│       ├── site.ts                # Site metadata
│       └── constants.ts           # App constants
├── .env.local                     # Local environment variables
├── .env.example                   # Environment variable template
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── next.config.js
├── package.json
├── pnpm-lock.yaml                 # Using pnpm for speed
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                    # Vercel deployment config
└── README.md
6.2 Key Files Explained
src/lib/supabase/client.ts
typescriptimport { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
src/lib/supabase/server.ts
typescriptimport { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
src/lib/prisma.ts
typescriptimport { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
src/lib/redis.ts
typescriptimport { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})
src/lib/replicate.ts
typescriptimport Replicate from 'replicate'

export const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export const TRYON_MODEL = 'cuuupid/idm-vton:c871bb9b046607b680449ecbae55fd8c6d945e0a1948644bf2361b3d021d3ff4'
src/lib/validations.ts
typescriptimport { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2).optional(),
})

export const tryonSchema = z.object({
  productId: z.string().cuid(),
})

export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10_000_000, 'File must be less than 10MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'File must be JPEG, PNG, or WebP'
    ),
})

7. ENVIRONMENT VARIABLES
7.1 Environment File Template
.env.example (commit to repo):
bash# ============================================================================
# NEXT.JS
# ============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# ============================================================================
# SUPABASE
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database connection (for Prisma)
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# ============================================================================
# UPSTASH REDIS
# ============================================================================
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# ============================================================================
# REPLICATE
# ============================================================================
REPLICATE_API_TOKEN=r8_your_token
REPLICATE_WEBHOOK_SECRET=whsec_your_secret

# ============================================================================
# SENTRY (Optional)
# ============================================================================
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token

# ============================================================================
# VERCEL ANALYTICS (Auto-configured in Vercel)
# ============================================================================
# NEXT_PUBLIC_VERCEL_ANALYTICS_ID=auto

# ============================================================================
# FEATURE FLAGS (Optional)
# ============================================================================
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_REALTIME=true
7.2 Local Development Setup
.env.local (DO NOT commit):
bash# Copy from .env.example and fill in real values
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
DATABASE_URL="postgresql://postgres:password@db.abcdefgh.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.abcdefgh.supabase.co:5432/postgres"
UPSTASH_REDIS_REST_URL=https://usw1-abc.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYA...
REPLICATE_API_TOKEN=r8_abc123...
7.3 Production Environment (Vercel)
Set in Vercel Dashboard → Settings → Environment Variables:
VariableValueEnvironmentsNEXT_PUBLIC_APP_URLhttps://virtualfit.comProductionNEXT_PUBLIC_SUPABASE_URLSupabase project URLAllNEXT_PUBLIC_SUPABASE_ANON_KEYSupabase anon keyAllSUPABASE_SERVICE_ROLE_KEYSupabase service roleProduction, PreviewDATABASE_URLPooled connectionAllDIRECT_URLDirect connectionProductionUPSTASH_REDIS_REST_URLRedis URLAllUPSTASH_REDIS_REST_TOKENRedis tokenAllREPLICATE_API_TOKENAPI tokenAllREPLICATE_WEBHOOK_SECRETWebhook secretProductionNEXT_PUBLIC_SENTRY_DSNSentry DSNProduction
7.4 Security Best Practices
Critical rules:

❌ NEVER commit .env.local to Git
✅ ALWAYS use NEXT_PUBLIC_ prefix for client-side vars
✅ ROTATE secrets if exposed (Supabase keys, Replicate tokens)
✅ USE Vercel's encrypted storage for production secrets
✅ LIMIT service role key usage (server-side only)


8. INSTALLATION & SETUP
8.1 Prerequisites
Required software:

Node.js 20.x or higher (nodejs.org)
pnpm 8.x or higher (faster than npm/yarn)
Git
Code editor (VS Code recommended)

Accounts needed:

GitHub account (version control)
Supabase account (supabase.com)
Upstash account (upstash.com)
Replicate account (replicate.com)
Vercel account (vercel.com)

8.2 Step-by-Step Setup (Local Development)
Step 1: Install pnpm
bash# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version  # Should be 8.x or higher
Step 2: Clone Repository (or create new)
bash# If starting fresh
mkdir virtualfit
cd virtualfit

# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo and push
git remote add origin https://github.com/your-username/virtualfit.git
git push -u origin main
Step 3: Initialize Next.js Project
bash# Create Next.js app with TypeScript
pnpx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install dependencies
pnpm install

# Install additional packages
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add @prisma/client
pnpm add -D prisma
pnpm add @upstash/redis @upstash/ratelimit
pnpm add replicate
pnpm add @tanstack/react-query
pnpm add react-hook-form @hookform/resolvers zod
pnpm add lucide-react
pnpm add date-fns
pnpm add clsx tailwind-merge

# Install shadcn/ui
pnpx shadcn-ui@latest init

# Add shadcn components
pnpx shadcn-ui@latest add button card dialog input select toast
```

#### Step 4: Setup Supabase

**4.1 Create Supabase Project:**
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name: `virtualfit-dev`
4. Database password: (save this securely)
5. Region: Choose closest to you
6. Click "Create project"

**4.2 Get Supabase Credentials:**
```
Project Settings → API
- Project URL: https://abcdefgh.supabase.co
- anon/public key: eyJhbGc...
- service_role key: eyJhbGc... (keep secret!)
```

**4.3 Get Database Connection String:**
```
Project Settings → Database → Connection string

Pooled (for Prisma):
postgresql://postgres:[password]@db.abcdefgh.supabase.co:5432/postgres?pgbouncer=true

Direct (for migrations):
postgresql://postgres:[password]@db.abcdefgh.supabase.co:5432/postgres
4.4 Setup Storage Bucket:
sql-- Go to Supabase Dashboard → Storage → Create bucket

Bucket name: user-photos
Public: true
File size limit: 10MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

**4.5 Enable Realtime (optional):**
```
Database → Replication → Add table: tryons
Step 5: Setup Upstash Redis

Go to console.upstash.com
Click "Create Database"
Name: virtualfit-cache
Region: Choose closest to your Vercel region
Type: Regional (cheaper for dev)
Copy REST URL and Token

Step 6: Setup Replicate

Go to replicate.com
Sign up/login
Go to Account → API Tokens
Create token (name: virtualfit)
Copy token (starts with r8_)

Step 7: Initialize Prisma
bash# Initialize Prisma
pnpm prisma init

# This creates:
# - prisma/schema.prisma
# - .env (with DATABASE_URL)

# Copy the schema from section 4.2 into prisma/schema.prisma

# Generate Prisma Client
pnpm prisma generate

# Create migration
pnpm prisma migrate dev --name init

# (Optional) Seed database with sample products
pnpm prisma db seed
Create seed file prisma/seed.ts:
typescriptimport { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create sample products
  await prisma.product.createMany({
    data: [
      {
        name: 'Classic White T-Shirt',
        category: 'shirt',
        gender: 'unisex',
        imageUrl: '/sample-products/shirt-1.jpg',
        thumbnail: '/sample-products/shirt-1-thumb.jpg',
        metadata: { brand: 'Sample Brand', color: 'white' },
      },
      // Add more products...
    ],
  })

  console.log('✅ Database seeded')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
Update package.json:
json{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
Step 8: Configure Environment Variables
bash# Copy example to local
cp .env.example .env.local

# Fill in values from Supabase, Upstash, Replicate
nano .env.local
Step 9: Run Development Server
bash# Start dev server
pnpm dev

# Open browser
# http://localhost:3000

# You should see the Next.js welcome page
```

#### Step 10: Verify Setup

**Checklist:**
- [ ] `http://localhost:3000` loads
- [ ] No errors in terminal
- [ ] Prisma Client generated (`node_modules/@prisma/client`)
- [ ] Database connection works (run `pnpm prisma studio`)
- [ ] All environment variables set

### 8.3 Common Setup Issues

**Issue 1: Prisma connection error**
```
Error: P1001: Can't reach database server
```
**Solution:**
- Check `DATABASE_URL` in `.env.local`
- Verify Supabase project is running
- Check firewall/VPN settings

**Issue 2: Module not found**
```
Cannot find module '@/lib/...'
Solution:

Check tsconfig.json has correct paths:

json{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Issue 3: Supabase client error**
```
createClient is not a function
```
**Solution:**
- Install correct package: `pnpm add @supabase/ssr` (not `@supabase/supabase-js` alone)

---

## 9. DEVELOPMENT WORKFLOW

### 9.1 Git Workflow

**Branch Strategy:**
```
main (production)
  └── dev (staging)
       ├── feature/auth
       ├── feature/upload
       └── feature/tryon
Workflow:
bash# Create feature branch
git checkout -b feature/auth

# Make changes, commit frequently
git add .
git commit -m "feat: implement login page"

# Push to GitHub
git push origin feature/auth

# Create Pull Request on GitHub
# Merge to dev → test on staging
# Merge dev to main → deploy to production
```

**Commit Message Convention:**
```
feat: Add new feature
fix: Bug fix
docs: Documentation update
style: Code formatting
refactor: Code restructuring
test: Add tests
chore: Tooling/config changes
9.2 Development Commands
bash# Start dev server
pnpm dev

# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint
pnpm lint:fix

# Code formatting
pnpm format

# Database commands
pnpm prisma studio           # GUI for database
pnpm prisma migrate dev      # Create migration
pnpm prisma generate         # Regenerate client
pnpm prisma db push          # Push schema (dev only)
pnpm prisma db seed          # Seed data

# Build for production
pnpm build

# Start production server locally
pnpm start

# Run all checks (pre-commit)
pnpm check-all
Add to package.json:
json{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "type-check": "tsc --noEmit",
    "check-all": "pnpm type-check && pnpm lint && pnpm build",
    "prisma:studio": "prisma studio",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "prisma:seed": "prisma db seed"
  }
}
9.3 Code Quality Tools
ESLint Config (.eslintrc.json):
json{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
Prettier Config (.prettierrc):
json{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
Husky (Git Hooks):
bash# Install Husky
pnpm add -D husky lint-staged

# Initialize
pnpm husky init

# Add pre-commit hook
echo "pnpm lint-staged" > .husky/pre-commit
.lintstagedrc.js:
javascriptmodule.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
}
9.4 Testing Strategy (Optional for MVP)
Future additions:
bash# Unit tests (Vitest)
pnpm add -D vitest @testing-library/react

# E2E tests (Playwright)
pnpm add -D @playwright/test

# API tests (Supertest)
pnpm add -D supertest @types/supertest
For MVP: Manual testing checklist sufficient (see Section 14)

10. DEPLOYMENT GUIDE
10.1 Vercel Deployment (Production)
Step 1: Connect GitHub to Vercel

Go to vercel.com
Click "Add New Project"
Import Git Repository → Select virtualfit
Configure:

Framework Preset: Next.js
Root Directory: ./
Build Command: pnpm build
Output Directory: .next
Install Command: pnpm install



Step 2: Environment Variables
In Vercel dashboard:

Go to Settings → Environment Variables
Add all variables from .env.example
Set for: Production, Preview, Development
Important: Use production values for Supabase, Upstash, Replicate

Production-specific values:
bashNEXT_PUBLIC_APP_URL=https://virtualfit.vercel.app
DATABASE_URL="..." # Production Supabase
REPLICATE_WEBHOOK_SECRET=whsec_... # Set in Replicate dashboard
Step 3: Deploy
bash# From local
git push origin main

# Vercel auto-deploys
# Or manually trigger in Vercel dashboard
Deployment URL:

Production: https://virtualfit.vercel.app
Preview (PR): https://virtualfit-git-<branch>.vercel.app

Step 4: Custom Domain (Optional)

Vercel → Settings → Domains
Add virtualfit.com
Update DNS records (provided by Vercel)
SSL auto-configured

Step 5: Configure Webhooks
Replicate → Vercel:

Replicate Dashboard → Webhooks
Add webhook URL: https://virtualfit.vercel.app/api/webhook/replicate
Events: prediction.completed, prediction.failed
Copy webhook secret → Add to Vercel env vars

10.2 Database Migration (Production)
bash# From local terminal
DATABASE_URL="<production-direct-url>" pnpm prisma migrate deploy

# Or use Vercel CLI
vercel env pull .env.production
DATABASE_URL="$(grep DIRECT_URL .env.production)" pnpm prisma migrate deploy
10.3 Monitoring Setup
Vercel Analytics (Auto-enabled):

Web Vitals: Core Web Vitals tracking
Real User Monitoring: Performance metrics

Sentry (Error Tracking):
bash# Install Sentry
pnpm add @sentry/nextjs

# Initialize
pnpx @sentry/wizard@latest -i nextjs

# Add DSN to Vercel env vars
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...
Vercel Logs:
bash# View logs
vercel logs <deployment-url>

# Real-time logs
vercel logs --follow
10.4 CI/CD Pipeline (GitHub Actions)
.github/workflows/ci.yml:
yamlname: CI

on:
  pull_request:
    branches: [main, dev]
  push:
    branches: [main, dev]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Build
        run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
10.5 Deployment Checklist
Pre-deployment:

 All tests pass locally
 Environment variables set in Vercel
 Database migrations applied to production
 Webhook URLs configured (Replicate)
 Error tracking setup (Sentry)
 Custom domain configured (if applicable)

Post-deployment:

 Test auth flow (signup, login, logout)
 Test upload functionality
 Test try-on generation (end-to-end)
 Check error tracking (trigger test error)
 Monitor logs for issues
 Verify webhooks are working

Rollback plan:
bash# Revert to previous deployment in Vercel dashboard
# Or redeploy previous Git commit
git revert HEAD
git push origin main
```

---

## 11. FEATURE SPECIFICATIONS

### 11.1 Authentication System

**Requirements:**
- Email/password signup and login
- Google OAuth (optional for MVP, add later)
- Session management (JWT via Supabase)
- Protected routes (redirect to login if not authenticated)
- Password reset flow (email-based)

**User Flow:**

**Signup:**
```
1. User enters email + password on /signup
2. Frontend validates (Zod schema)
3. POST /api/auth/signup
4. Supabase creates user
5. Auto-login after signup
6. Redirect to /upload (first-time user flow)
```

**Login:**
```
1. User enters credentials on /login
2. POST /api/auth/login
3. Supabase validates
4. Set session cookie
5. Redirect to /dashboard
Protected Routes:
typescript// middleware.ts
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const protectedRoutes = ['/dashboard', '/upload', '/products', '/gallery', '/settings']
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const supabase = createClient(req)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  return NextResponse.next()
}
```

**Implementation Notes:**
- Use Supabase Auth for user management (don't roll your own)
- Store session in HTTP-only cookies (security)
- Implement CSRF protection (Supabase handles this)
- Rate limit auth endpoints (5 attempts per 15 min)

### 11.2 Photo Upload System

**Requirements:**
- Single full-body photo per user (updatable)
- Drag-and-drop + file picker
- Image preview before upload
- Validation: size, type, dimensions
- Progress indicator during upload
- Stored in Supabase Storage

**User Flow:**
```
1. User navigates to /upload
2. Drags image or clicks to select
3. Frontend validates (client-side)
4. Preview shown
5. User clicks "Upload"
6. POST /api/upload/user-photo (multipart/form-data)
7. Backend validates again
8. Upload to Supabase Storage bucket "user-photos"
9. Update user.userPhotoUrl in database
10. Redirect to /products
Validation Rules:
typescriptconst uploadValidation = {
  fileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxSize: 10 * 1024 * 1024, // 10MB
  minWidth: 800,
  minHeight: 1200,
  aspectRatio: 'portrait', // height > width
}
Error Handling:

File too large → "Image must be less than 10MB"
Wrong type → "Please upload a JPEG, PNG, or WebP image"
Wrong orientation → "Please upload a portrait-oriented photo"
Upload failed → "Upload failed. Please try again."

Component Structure:
typescript// components/upload/ImageUpload.tsx
export function ImageUpload() {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  
  const handleDrop = (files: File[]) => {
    const file = files[0]
    if (!validateFile(file)) return
    setPreview(URL.createObjectURL(file))
  }
  
  const handleUpload = async () => {
    setUploading(true)
    const formData = new FormData()
    formData.append('photo', file)
    
    const res = await fetch('/api/upload/user-photo', {
      method: 'POST',
      body: formData,
    })
    
    if (res.ok) {
      router.push('/products')
    }
    setUploading(false)
  }
  
  return (
    <div>
      <Dropzone onDrop={handleDrop} />
      {preview && <img src={preview} />}
      <Button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </Button>
    </div>
  )
}
11.3 Product Catalog
Requirements:

Grid view of products
Filter by category (shirt, dress, pants, etc.)
Filter by gender (male, female, unisex)
Responsive design (1 col mobile, 3 cols desktop)
Click product → detail page

Data Source (MVP):

Hardcoded in database (seed file)
20-30 sample products
High-quality product images (white background, front view)

Product Card Design:
typescript// components/products/ProductCard.tsx
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <img src={product.thumbnail} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.category}</p>
      <Button onClick={() => router.push(`/products/${product.id}`)}>
        Try On
      </Button>
    </Card>
  )
}
Catalog Page:
typescript// app/(dashboard)/products/page.tsx
export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
  
  return (
    <div>
      <h1>Product Catalog</h1>
      <ProductFilter />
      <ProductGrid products={products} />
    </div>
  )
}
```

### 11.4 Virtual Try-On Flow

**User Flow:**
```
1. User on /products/[id] (product detail page)
2. Clicks "Try This On"
3. Frontend checks: user.userPhotoUrl exists?
   - If no → redirect to /upload
   - If yes → proceed
4. POST /api/tryon { productId }
5. Backend:
   - Check credits
   - Check rate limit
   - Create TryOn record (status: queued)
   - Call Replicate API (async)
   - Return { tryOnId, status: 'queued' }
6. Frontend:
   - Show loading state (progress bar, estimated time)
   - Poll GET /api/tryon/:id every 3 seconds
   OR subscribe to Supabase Realtime
7. When status = 'completed':
   - Display result image
   - Show download/share buttons
8. Save to gallery automatically
Frontend Component:
typescript// components/tryon/TryOnButton.tsx
export function TryOnButton({ productId }: { productId: string }) {
  const { user } = useAuth()
  const { mutate: createTryOn, isLoading } = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      })
      return res.json()
    },
    onSuccess: (data) => {
      // Start polling or subscribe to realtime
      pollTryOnStatus(data.tryOnId)
    },
  })
  
  const handleClick = () => {
    if (!user.userPhotoUrl) {
      router.push('/upload')
      return
    }
    createTryOn()
  }
  
  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Try This On'}
    </Button>
  )
}
Backend API Route:
typescript// app/api/tryon/route.ts
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { productId } = await req.json()
  
  // Get user from DB
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })
  
  if (!dbUser.userPhotoUrl) {
    return NextResponse.json(
      { error: 'Please upload your photo first' },
      { status: 400 }
    )
  }
  
  // Check credits
  if (dbUser.credits < 1) {
    return NextResponse.json(
      { error: 'Insufficient credits' },
      { status: 402 }
    )
  }
  
  // Check rate limit
  const rateLimit = await checkRateLimit(dbUser.id)
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
      { status: 429 }
    )
  }
  
  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  })
  
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  
  // Create TryOn record
  const tryOn = await prisma.tryOn.create({
    data: {
      userId: dbUser.id,
      productId,
      userPhotoUrl: dbUser.userPhotoUrl,
      productImageUrl: product.imageUrl,
      status: 'queued',
    },
  })
  
  // Call Replicate API (async, don't await)
  callReplicateAPI(tryOn.id, dbUser.userPhotoUrl, product.imageUrl)
  
  // Decrement credits
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { credits: { decrement: 1 } },
  })
  
  return NextResponse.json({
    tryOnId: tryOn.id,
    status: 'queued',
    estimatedTime: 20, // seconds
  }, { status: 202 })
}

async function callReplicateAPI(tryOnId: string, userPhotoUrl: string, productUrl: string) {
  const startTime = Date.now()
  
  try {
    const prediction = await replicate.predictions.create({
      version: TRYON_MODEL,
      input: {
        human_img: userPhotoUrl,
        garm_img: productUrl,
      },
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/replicate`,
      webhook_events_filter: ['completed'],
    })
    
    // Update with Replicate prediction ID
    await prisma.tryOn.update({
      where: { id: tryOnId },
      data: {
        replicateId: prediction.id,
        status: 'processing',
      },
    })
  } catch (error) {
    console.error('Replicate API error:', error)
    await prisma.tryOn.update({
      where: { id: tryOnId },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    })
  }
}
Webhook Handler:
typescript// app/api/webhook/replicate/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  
  // Verify webhook signature
  const signature = req.headers.get('webhook-signature')
  if (!verifyReplicateSignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const { id, status, output, error } = body
  
  // Find TryOn by replicateId
  const tryOn = await prisma.tryOn.findUnique({
    where: { replicateId: id },
  })
  
  if (!tryOn) {
    return NextResponse.json({ error: 'TryOn not found' }, { status: 404 })
  }
  
  if (status === 'succeeded') {
    await prisma.tryOn.update({
      where: { id: tryOn.id },
      data: {
        status: 'completed',
        resultUrl: output,
        completedAt: new Date(),
        processingTimeMs: Date.now() - new Date(tryOn.createdAt).getTime(),
      },
    })
  } else if (status === 'failed') {
    await prisma.tryOn.update({
      where: { id: tryOn.id },
      data: {
        status: 'failed',
        errorMessage: error,
      },
    })
  }
  
  return NextResponse.json({ message: 'Webhook processed' })
}
Polling Alternative (if not using Realtime):
typescript// hooks/useTryOn.ts
export function useTryOnPolling(tryOnId: string) {
  return useQuery({
    queryKey: ['tryon', tryOnId],
    queryFn: async () => {
      const res = await fetch(`/api/tryon/${tryOnId}`)
      return res.json()
    },
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 3000 // Poll every 3 seconds
    },
  })
}
11.5 Gallery/History
Requirements:

Show all user's past try-ons
Grid layout (2 cols mobile, 4 cols desktop)
Filter by date, status
Click to view full-size result
Download button
Delete button

Page:
typescript// app/(dashboard)/gallery/page.tsx
export default async function GalleryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  })
  
  const tryOns = await prisma.tryOn.findMany({
    where: { userId: dbUser.id },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  })
  
  return (
    <div>
      <h1>My Try-Ons</h1>
      <GalleryGrid tryOns={tryOns} />
    </div>
  )
}
Component:
typescript// components/gallery/GalleryItem.tsx
export function GalleryItem({ tryOn }: { tryOn: TryOn }) {
  const { mutate: deleteTryOn } = useMutation({
    mutationFn: async () => {
      await fetch(`/api/gallery/${tryOn.id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gallery'])
    },
  })
  
  return (
    <Card>
      {tryOn.status === 'completed' ? (
        <img src={tryOn.resultUrl} alt="Try-on result" />
      ) : (
        <div>Processing...</div>
      )}
      <p>{tryOn.product.name}</p>
      <p>{formatDate(tryOn.createdAt)}</p>
      <div>
        <Button onClick={() => downloadImage(tryOn.resultUrl)}>
          Download
        </Button>
        <Button variant="destructive" onClick={() => deleteTryOn()}>
          Delete
        </Button>
      </div>
    </Card>
  )
}

12. SECURITY & PERFORMANCE
12.1 Security Measures
Authentication Security:

 Use Supabase Auth (battle-tested)
 HTTP-only cookies for sessions
 CSRF protection (built into Supabase)
 Rate limiting on auth endpoints (5 attempts / 15 min)
 Strong password requirements (8+ chars, 1 uppercase, 1 number)
 Email verification (optional for MVP)

API Security:

 Validate all inputs (Zod schemas)
 Sanitize user-uploaded content
 Rate limiting (Upstash Redis)
 CORS configuration (whitelist domains)
 Webhook signature verification (Replicate)
 SQL injection protection (Prisma ORM)

Data Security:

 Row Level Security (RLS) in Supabase
 Encrypt sensitive data at rest (Supabase handles this)
 HTTPS only (enforced by Vercel)
 Secure environment variables (Vercel encrypted storage)
 Regular dependency updates (Dependabot)

File Upload Security:
typescript// Validation example
const validateUpload = (file: File) => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  // Check file size
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File too large')
  }
  
  // Check file extension (prevent spoofing)
  const ext = file.name.split('.').pop()
  if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    throw new Error('Invalid file extension')
  }
  
  // Rename file (prevent path traversal)
  const newName = `${userId}_${Date.now()}.${ext}`
  
  return newName
}
OWASP Top 10 Checklist:

 A01: Broken Access Control → RLS policies
 A02: Cryptographic Failures → HTTPS, encrypted env vars
 A03: Injection → Prisma ORM, Zod validation
 A04: Insecure Design → Secure by default (Supabase Auth)
 A05: Security Misconfiguration → Vercel security headers
 A06: Vulnerable Components → Dependabot alerts
 A07: Authentication Failures → Supabase handles this
 A08: Software & Data Integrity → Webhook signature verification
 A09: Logging Failures → Sentry error tracking
 A10: SSRF → No user-controlled URLs in API calls

12.2 Performance Optimization
Frontend Performance:
1. Image Optimization
typescript// Use Next.js Image component
import Image from 'next/image'

<Image
  src={product.imageUrl}
  alt={product.name}
  width={400}
  height={600}
  placeholder="blur"
  blurDataURL={product.thumbnail} // Low-res placeholder
  priority={index < 4} // LCP optimization for first 4 images
/>
2. Code Splitting
typescript// Lazy load heavy components
const TryOnResult = dynamic(() => import('@/components/tryon/TryOnResult'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-side only
})
3. Data Fetching
typescript// Server Components for initial load (no client JS)
export default async function ProductsPage() {
  const products = await prisma.product.findMany() // Server-side
  return <ProductGrid products={products} />
}

// Client-side for interactions
'use client'
export function ProductFilter() {
  const { data } = useQuery(['products'], fetchProducts)
  // ...
}
4. Caching Strategy
typescript// API route caching
export const revalidate = 3600 // 1 hour

export async function GET() {
  const products = await prisma.product.findMany()
  
  return NextResponse.json(products, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    },
  })
}
Backend Performance:
1. Database Query Optimization
typescript// Bad: N+1 query
const users = await prisma.user.findMany()
for (const user of users) {
  const tryOns = await prisma.tryOn.findMany({ where: { userId: user.id } })
}

// Good: Include relation
const users = await prisma.user.findMany({
  include: { tryOns: true }
})
2. Connection Pooling
bash# .env (Supabase provides connection pooling via PgBouncer)
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
3. Redis Caching
typescript// Cache expensive queries
export async function getProducts() {
  const cacheKey = 'products:all'
  
  // Check cache first
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Fetch from DB
  const products = await prisma.product.findMany()
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(products))
  
  return products
}
4. CDN for Static Assets

Vercel automatically serves static files via Edge Network
Images stored in Supabase Storage use CDN
Configure next.config.js:

javascriptmodule.exports = {
  images: {
    domains: ['your-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
  },
}
Performance Budgets:

First Contentful Paint (FCP): < 1.8s
Largest Contentful Paint (LCP): < 2.5s
Time to Interactive (TTI): < 3.8s
Cumulative Layout Shift (CLS): < 0.1

Monitoring:
bash# Vercel Analytics (auto-enabled)
# Lighthouse CI in GitHub Actions

# .github/workflows/lighthouse.yml
- name: Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://virtualfit.vercel.app
      https://virtualfit.vercel.app/products
    budgetPath: ./lighthouse-budget.json
12.3 Error Handling
Error Types:

Client-side errors (user input, network)
Server-side errors (database, API)
Third-party errors (Replicate, Supabase)

Global Error Boundary:
typescript// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to Sentry
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
API Error Handling:
typescript// lib/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message)
  }
}

export function handleAPIError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Resource already exists' },
        { status: 409 }
      )
    }
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error)
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

// Usage in API route
try {
  // ... business logic
} catch (error) {
  return handleAPIError(error)
}
User-Facing Error Messages:
typescriptconst ERROR_MESSAGES = {
  UPLOAD_FAILED: 'Failed to upload image. Please try again.',
  TRYON_FAILED: 'Try-on generation failed. Please try again or contact support.',
  RATE_LIMIT: 'You\'ve reached your daily limit. Upgrade for more try-ons.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  INSUFFICIENT_CREDITS: 'You\'re out of credits. Upgrade your plan.',
}

13. MONITORING & LOGGING
13.1 Error Tracking (Sentry)
Setup:
bashpnpm add @sentry/nextjs
pnpx @sentry/wizard@latest -i nextjs
Configuration:
typescript// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
Usage:
typescript// Capture exception
try {
  await uploadPhoto()
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'upload' },
    extra: { userId: user.id },
  })
  throw error
}

// Custom events
Sentry.captureMessage('Try-on completed', {
  level: 'info',
  extra: { tryOnId, processingTime },
})
13.2 Analytics
Vercel Analytics (Web Vitals):

Auto-enabled in Vercel
Tracks: LCP, FID, CLS, TTFB
Dashboard: Vercel → Analytics

Custom Events:
typescript// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}

// Track custom events
import { track } from '@vercel/analytics'

track('tryon_completed', {
  productId,
  processingTime,
})
Database Analytics (Optional):
typescript// Save events to database
await prisma.event.create({
  data: {
    userId: user.id,
    eventName: 'tryon_started',
    metadata: { productId },
  },
})

// Query for insights
const topProducts = await prisma.event.groupBy({
  by: ['metadata'],
  where: { eventName: 'tryon_completed' },
  _count: true,
  orderBy: { _count: { _all: 'desc' } },
  take: 10,
})
13.3 Logging Strategy
Server-Side Logging:
typescript// lib/logger.ts
const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date() }))
  },
  error: (message: string, error: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: { message: error.message, stack: error.stack },
      ...meta,
      timestamp: new Date(),
    }))
  },
  warn: (message: string, meta?: object) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta, timestamp: new Date() }))
  },
}

// Usage
logger.info('Try-on started', { userId, productId })
logger.error('Replicate API failed', error, { tryOnId })
Vercel Logs:
bash# View production logs
vercel logs --prod

# Real-time logs
vercel logs --follow

# Filter by function
vercel logs --prod --filter=/api/tryon
13.4 Health Checks
API Health Endpoint:
typescript// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage(),
  }
  
  const allHealthy = Object.values(checks).every(Boolean)
  
  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date(),
  }, {
    status: allHealthy ? 200 : 503,
  })
}

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}

async function checkRedis() {
  try {
    await redis.ping()
    return true
  } catch {
    return false
  }
}

async function checkStorage() {
  try {
    const { data } = await supabase.storage.from('user-photos').list('', { limit: 1 })
    return true
  } catch {
    return false
  }
}
Uptime Monitoring:

Use UptimeRobot (free) or Better Uptime
Monitor: https://virtualfit.vercel.app/api/health
Alert if down for > 5 minutes


14. MAINTENANCE & SCALING
14.1 Database Maintenance
Backup Strategy:

Supabase auto-backups daily (retained 7 days on free tier)
For critical data, enable Point-in-Time Recovery (PITR) in Supabase
Export database manually before major migrations:

bash# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore if needed
psql $DATABASE_URL < backup_20260208.sql
Index Maintenance:
sql-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Drop unused indexes
DROP INDEX IF EXISTS idx_unused;

-- Rebuild indexes (if performance degrades)
REINDEX TABLE tryons;
Database Cleanup:
typescript// Cron job to delete old completed try-ons (optional)
// Keep last 30 days for free users, unlimited for paid

export async function cleanupOldTryOns() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  await prisma.tryOn.deleteMany({
    where: {
      status: 'completed',
      createdAt: { lt: thirtyDaysAgo },
      user: { planType: 'free' },
    },
  })
}
14.2 Scaling Considerations
When to Scale:
Vertical Scaling (Upgrade plans):

Database: Upgrade Supabase plan when > 500MB data or > 10K connections/day
Redis: Upgrade Upstash when > 100K requests/day
Vercel: Upgrade when > 100GB bandwidth/month

Horizontal Scaling (Add resources):

Serverless functions scale automatically (Vercel handles this)
Add read replicas for database (Supabase Pro plan)
Add CDN for images (already included via Supabase/Vercel)

Performance Bottlenecks:

Replicate API (most likely bottleneck)

Problem: Try-on generation takes 10-30 seconds
Solution: Implement queue system (already in architecture)
Alternative: Use multiple Replicate accounts for parallel processing


Database queries

Problem: Slow gallery page load with 1000+ try-ons
Solution: Implement pagination, add indexes, use cursor-based pagination


Image uploads

Problem: Large images slow down uploads
Solution: Client-side image compression before upload



Code Example - Image Compression:
typescript// lib/image-compression.ts
import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  }