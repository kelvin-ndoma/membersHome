membershome/
│
├── app/                              # Next.js 13+ App Router
│   ├── (auth)/                       # Authentication routes group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── verify-email/
│   │
│   ├── (platform)/                   # Platform admin routes (membersHome staff)
│   │   ├── platform/
│   │   │   ├── dashboard/
│   │   │   ├── organizations/
│   │   │   ├── users/
│   │   │   ├── analytics/
│   │   │   ├── settings/
│   │   │   └── billing/
│   │   └── layout.tsx
│   │
│   ├── (org)/                        # Organization admin routes
│   │   ├── org/
│   │   │   ├── [orgSlug]/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── members/
│   │   │   │   ├── houses/
│   │   │   │   ├── membership-plans/
│   │   │   │   ├── events/
│   │   │   │   ├── applications/
│   │   │   │   ├── communications/
│   │   │   │   ├── reports/
│   │   │   │   ├── settings/
│   │   │   │   └── billing/
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   │
│   ├── (house)/                      # House admin & member portal routes
│   │   ├── house/
│   │   │   ├── [orgSlug]/
│   │   │   │   ├── [houseSlug]/
│   │   │   │   │   ├── portal/      # Member portal
│   │   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   ├── events/
│   │   │   │   │   │   ├── tickets/
│   │   │   │   │   │   ├── announcements/
│   │   │   │   │   │   ├── profile/
│   │   │   │   │   │   ├── billing/
│   │   │   │   │   │   ├── directory/
│   │   │   │   │   │   ├── messages/
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │
│   │   │   │   │   ├── admin/        # House admin dashboard
│   │   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   ├── members/
│   │   │   │   │   │   ├── events/
│   │   │   │   │   │   ├── forms/
│   │   │   │   │   │   ├── communications/
│   │   │   │   │   │   ├── reports/
│   │   │   │   │   │   └── settings/
│   │   │   │   │   │
│   │   │   │   │   └── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx
│   │
│   ├── api/                          # Next.js API routes
│   │   ├── auth/                     # Next-Auth configuration
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── platform/                 # Platform admin APIs
│   │   ├── org/                      # Organization APIs
│   │   ├── house/                    # House APIs
│   │   └── webhooks/                 # External webhooks
│   │       ├── stripe/
│   │       └── sendgrid/
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/                       # Reusable React components
│   ├── ui/                          # Shadcn/ui components
│   ├── layout/                      # Layout components
│   ├── auth/                        # Auth components
│   ├── platform/                    # Platform admin components
│   ├── org/                         # Organization components
│   ├── house/                       # House components
│   │   ├── portal/                  # Member portal components
│   │   └── admin/                   # House admin components
│   ├── events/                      # Shared event components
│   ├── billing/                     # Billing components
│   └── shared/                      # Shared components
│
├── lib/                             # Core libraries & utilities
│   ├── prisma/                      # Prisma client (ONE Prisma instance)
│   │   ├── client.ts                # Singleton Prisma client
│   │   ├── seed.ts                  # Database seed script
│   │   └── migrations/              # Prisma migrations
│   │
│   ├── auth/                        # Next-Auth configuration
│   │   ├── options.ts
│   │   └── roles.ts
│   │
│   ├── db/                          # Database utilities
│   │   ├── mongodb.ts               # MongoDB connection
│   │   ├── repositories/            # Data access layer
│   │   └── queries/                 # Complex queries
│   │
│   ├── services/                    # Business logic layer
│   │   ├── auth/
│   │   ├── organization/
│   │   ├── member/
│   │   ├── events/
│   │   ├── billing/
│   │   ├── communication/
│   │   ├── forms/
│   │   ├── reporting/
│   │   └── portal/
│   │
│   ├── middleware/                  # Custom middleware
│   ├── utils/                       # Utility functions
│   ├── constants/                   # App constants
│   ├── types/                       # TypeScript type definitions
│   ├── validators/                  # Zod validation schemas
│   └── hooks/                       # Custom React hooks
│
├── contexts/                        # React context providers
├── providers/                       # App providers
├── styles/                          # Global styles
├── public/                          # Static assets
├── prisma/                          # Prisma schema (symlink to lib/prisma)
│   └── schema.prisma                # Database schema definition
│
├── scripts/                         # Utility scripts
├── tests/                           # Testing
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                            # Documentation
│
├── .env.local
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── middleware.ts                    # Next.js middleware
├── next-auth.d.ts
└── README.md