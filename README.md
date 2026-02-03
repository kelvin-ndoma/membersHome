app/
├── layout.tsx
├── page.tsx                   # Homepage (marketing)
├── globals.css
├── loading.tsx
├── error.tsx
├── not-found.tsx
│
├── auth/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── error/
│   │   └── page.tsx
│   └── verify-request/
│       └── page.tsx
│
├── platform/
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── organizations/
│   │   │   └── page.tsx
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   ├── audit-logs/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── profile/
│       └── page.tsx
│
├── organization/
│   ├── create/
│   │   └── page.tsx
│   └── [orgSlug]/
│       ├── dashboard/
│       │   └── page.tsx
│       ├── houses/
│       │   ├── page.tsx
│       │   ├── create/
│       │   │   └── page.tsx
│       │   └── [houseSlug]/
│       │       └── edit/
│       │           └── page.tsx
│       ├── members/
│       │   ├── page.tsx
│       │   ├── invite/
│       │   │   └── page.tsx
│       │   └── [memberId]/
│       │       └── page.tsx
│       ├── events/
│       │   ├── page.tsx
│       │   └── calendar/
│       │       └── page.tsx
│       ├── communications/
│       │   ├── page.tsx
│       │   ├── create/
│       │   │   └── page.tsx
│       │   └── [id]/
│       │       └── page.tsx
│       ├── reports/
│       │   ├── page.tsx
│       │   └── [reportId]/
│       │       └── page.tsx
│       ├── billing/
│       │   └── page.tsx
│       ├── settings/
│       │   ├── page.tsx
│       │   ├── branding/
│       │   │   └── page.tsx
│       │   ├── security/
│       │   │   └── page.tsx
│       │   └── integrations/
│       │       └── page.tsx
│       └── profile/
│           └── page.tsx
│
├── house/
│   ├── [orgSlug]/[houseSlug]/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [eventId]/
│   │   │       ├── page.tsx
│   │   │       └── manage/
│   │   │           └── page.tsx
│   │   ├── members/
│   │   │   ├── page.tsx
│   │   │   ├── invite/
│   │   │   │   └── page.tsx
│   │   │   └── [memberId]/
│   │   │       └── page.tsx
│   │   ├── communications/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── join/
│   │       └── page.tsx
│   └── invite/
│       └── [token]/
│           └── page.tsx
│
├── api/
│   ├── auth/
│   │   └── [...nextauth]/
│   │       └── route.ts
│   └── auth/
│       └── register/
│           └── route.ts
│
└── marketing/
    ├── about/
    │   └── page.tsx
    ├── pricing/
    │   └── page.tsx
    ├── features/
    │   └── page.tsx
    ├── contact/
    │   └── page.tsx
    └── legal/
        ├── privacy/
        │   └── page.tsx
        └── terms/
            └── page.tsx

            
Feature	PLATFORM_ADMIN	ORG_OWNER	ORG_ADMIN	MEMBER	HOUSE_ADMIN	HOUSE_MEMBER
Organization						
Create Org	✅	❌	❌	❌	❌	❌
Delete Org	✅	❌	❌	❌	❌	❌
Update Settings	✅	✅	❌	❌	❌	❌
View Org	✅	✅	✅	✅	✅	✅
House						
Create House	✅	❌	❌	❌	❌	❌
Delete House	✅	✅	❌	❌	❌	❌
Update House	✅	✅	❌	❌	✅*	❌
View House	✅	✅	✅	✅	✅	✅
People/CRM						
Add Members	✅	✅	✅	❌	✅*	❌
Remove Members	✅	✅	✅	❌	✅*	❌
View Members	✅	✅	✅	✅	✅*	✅*
Commerce						
Create Invoices	✅	✅	✅	❌	❌	❌
View Invoices	✅	✅	✅	✅	✅*	❌
Process Payments	✅	✅	✅	❌	❌	❌