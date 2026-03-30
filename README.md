membershome/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── loading.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   │
│   ├── auth/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── signout/
│   │   │   └── page.tsx
│   │   ├── error/
│   │   │   └── page.tsx
│   │   └── verify-request/
│   │       └── page.tsx
│   │
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── organizations/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [orgId]/
│   │   │       ├── page.tsx
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   ├── houses/
│   │   │   ├── page.tsx
│   │   │   └── [houseId]/
│   │   │       └── page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── [userId]/
│   │   │       └── page.tsx
│   │   ├── tickets/
│   │   │   ├── page.tsx                    # Platform-wide ticket sales
│   │   │   └── [ticketId]/
│   │   │       └── page.tsx                # Public ticket purchase
│   │   ├── billing/
│   │   │   └── page.tsx
│   │   ├── audit-logs/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── organization/
│   │   ├── page.tsx
│   │   ├── create/
│   │   │   └── page.tsx
│   │   └── [orgSlug]/
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── people/
│   │       │   ├── page.tsx
│   │       │   ├── create/
│   │       │   │   └── page.tsx
│   │       │   └── [memberId]/
│   │       │       ├── page.tsx
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       ├── houses/
│   │       │   ├── page.tsx
│   │       │   └── [houseSlug]/
│   │       │       └── page.tsx
│   │       ├── events/
│   │       │   ├── page.tsx
│   │       │   ├── create/
│   │       │   │   └── page.tsx
│   │       │   ├── calendar/
│   │       │   │   └── page.tsx
│   │       │   └── [eventId]/
│   │       │       ├── page.tsx
│   │       │       └── manage/
│   │       │           └── page.tsx
│   │       ├── commerce/
│   │       │   ├── page.tsx
│   │       │   ├── invoices/
│   │       │   │   ├── page.tsx
│   │       │   │   ├── create/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── [invoiceId]/
│   │       │   │       ├── page.tsx
│   │       │   │       └── pdf/
│   │       │   │           └── page.tsx
│   │       │   └── subscriptions/
│   │       │       ├── page.tsx
│   │       │       └── plans/
│   │       │           └── page.tsx
│   │       ├── memberships/
│   │       │   ├── page.tsx
│   │       │   ├── enroll/
│   │       │   │   └── page.tsx
│   │       │   └── check-in/
│   │       │       └── page.tsx
│   │       ├── communications/
│   │       │   ├── page.tsx
│   │       │   ├── create/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx
│   │       │       └── stats/
│   │       │           └── page.tsx
│   │       ├── reports/
│   │       │   ├── page.tsx
│   │       │   └── [reportId]/
│   │       │       └── page.tsx
│   │       ├── billing/
│   │       │   └── page.tsx
│   │       ├── settings/
│   │       │   ├── page.tsx
│   │       │   ├── branding/
│   │       │   │   └── page.tsx
│   │       │   ├── security/
│   │       │   │   └── page.tsx
│   │       │   └── integrations/
│   │       │       └── page.tsx
│   │       └── profile/
│   │           └── page.tsx
│   │
│   ├── house/
│   │   ├── [orgSlug]/[houseSlug]/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                # House dashboard with role-specific view
│   │   │   ├── members/
│   │   │   │   ├── page.tsx                # List all house members
│   │   │   │   ├── invite/
│   │   │   │   │   └── page.tsx            # Invite members to house
│   │   │   │   ├── roles/
│   │   │   │   │   └── page.tsx            # Manage member roles (admin only)
│   │   │   │   └── [memberId]/
│   │   │   │       ├── page.tsx            # Member profile
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx        # Edit member details
│   │   │   ├── events/
│   │   │   │   ├── page.tsx                # House events
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx            # Create event (admin/staff)
│   │   │   │   └── [eventId]/
│   │   │   │       ├── page.tsx            # Event details
│   │   │   │       ├── manage/
│   │   │   │       │   └── page.tsx        # Manage event (admin/staff)
│   │   │   │       └── attendees/
│   │   │   │           └── page.tsx        # View attendees (admin/staff)
│   │   │   ├── tickets/                    # NEW: Ticket management
│   │   │   │   ├── page.tsx                # List all tickets
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx            # Create ticket (admin/staff)
│   │   │   │   ├── sales/
│   │   │   │   │   ├── page.tsx            # Ticket sales dashboard
│   │   │   │   │   └── reports/
│   │   │   │   │       └── page.tsx        # Sales reports
│   │   │   │   ├── [ticketId]/
│   │   │   │   │   ├── page.tsx            # Ticket details
│   │   │   │   │   ├── edit/
│   │   │   │   │   │   └── page.tsx        # Edit ticket
│   │   │   │   │   └── scan/
│   │   │   │   │       └── page.tsx        # Scan ticket at entrance
│   │   │   │   └── public/
│   │   │   │       └── [ticketId]/
│   │   │   │           └── page.tsx        # Public ticket purchase page
│   │   │   ├── communications/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── stats/
│   │   │   │           └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx                # House settings (admin only)
│   │   │   │   ├── general/
│   │   │   │   │   └── page.tsx            # General settings
│   │   │   │   ├── permissions/
│   │   │   │   │   └── page.tsx            # Role permissions
│   │   │   │   └── integrations/
│   │   │   │       └── page.tsx            # External integrations
│   │   │   └── join/
│   │   │       └── page.tsx                # Public join page
│   │   └── invite/
│   │       └── [token]/
│   │           └── page.tsx                # Accept house invitation
│   │
│   ├── tickets/                            # NEW: Public ticket purchasing
│   │   ├── [ticketId]/
│   │   │   └── page.tsx                    # Public ticket page
│   │   └── success/
│   │       └── page.tsx                    # Purchase confirmation
│   │
│   ├── marketing/
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── features/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   └── legal/
│   │       ├── privacy/
│   │       │   └── page.tsx
│   │       └── terms/
│   │           └── page.tsx
│   │
│   └── api/
│       ├── auth/
│       │   ├── [...nextauth]/
│       │   │   └── route.ts
│       │   └── register/
│       │       └── route.ts
│       │
│       ├── admin/
│       │   ├── organizations/
│       │   │   ├── route.ts
│       │   │   ├── [orgId]/
│       │   │   │   ├── route.ts
│       │   │   │   └── houses/
│       │   │   │       └── route.ts
│       │   │   └── stats/
│       │   │       └── route.ts
│       │   ├── users/
│       │   │   ├── route.ts
│       │   │   └── [userId]/
│       │   │       └── route.ts
│       │   └── tickets/
│       │       └── route.ts                # Platform-wide ticket stats
│       │
│       ├── organizations/
│       │   ├── route.ts
│       │   └── [orgSlug]/
│       │       ├── route.ts
│       │       ├── members/
│       │       │   ├── route.ts
│       │       │   └── [memberId]/
│       │       │       ├── route.ts
│       │       │       └── resend-invitation/
│       │       │           └── route.ts
│       │       ├── houses/
│       │       │   ├── route.ts
│       │       │   └── [houseSlug]/
│       │       │       ├── route.ts
│       │       │       ├── members/
│       │       │       │   ├── route.ts
│       │       │       │   └── [memberId]/
│       │       │       │       ├── route.ts
│       │       │       │       └── roles/
│       │       │       │           └── route.ts  # Update member roles
│       │       │       └── settings/
│       │       │           └── route.ts
│       │       ├── events/
│       │       │   ├── route.ts
│       │       │   └── [eventId]/
│       │       │       ├── route.ts
│       │       │       ├── rsvp/
│       │       │       │   └── route.ts
│       │       │       └── attendees/
│       │       │           └── route.ts
│       │       ├── tickets/                # NEW: House ticket API
│       │       │   ├── route.ts            # GET, POST tickets
│       │       │   ├── stats/
│       │       │   │   └── route.ts        # Ticket sales stats
│       │       │   └── [ticketId]/
│       │       │       ├── route.ts        # GET, PATCH, DELETE ticket
│       │       │       ├── purchase/
│       │       │       │   └── route.ts    # POST purchase ticket
│       │       │       ├── validate/
│       │       │       │   └── route.ts    # POST validate ticket
│       │       │       └── sales/
│       │       │           └── route.ts    # GET sales data
│       │       ├── commerce/
│       │       │   ├── invoices/
│       │       │   │   ├── route.ts
│       │       │   │   └── [invoiceId]/
│       │       │   │       ├── route.ts
│       │       │   │       ├── download/
│       │       │   │       │   └── route.ts
│       │       │   │       └── send/
│       │       │   │           └── route.ts
│       │       │   └── subscriptions/
│       │       │       ├── route.ts
│       │       │       └── [subscriptionId]/
│       │       │           └── route.ts
│       │       ├── communications/
│       │       │   ├── route.ts
│       │       │   └── [commId]/
│       │       │       ├── route.ts
│       │       │       └── send/
│       │       │           └── route.ts
│       │       ├── reports/
│       │       │   ├── route.ts
│       │       │   └── [reportId]/
│       │       │       ├── route.ts
│       │       │       └── download/
│       │       │           └── route.ts
│       │       ├── memberships/
│       │       │   ├── stats/
│       │       │   │   └── route.ts
│       │       │   ├── enroll/
│       │       │   │   └── route.ts
│       │       │   └── check-in/
│       │       │       └── route.ts
│       │       ├── settings/
│       │       │   ├── route.ts
│       │       │   ├── branding/
│       │       │   │   └── route.ts
│       │       │   └── integrations/
│       │       │       └── route.ts
│       │       └── audit-logs/
│       │           └── route.ts
│       │
│       ├── houses/
│       │   └── [orgSlug]/[houseSlug]/
│       │       ├── dashboard/
│       │       │   └── route.ts
│       │       ├── events/
│       │       │   └── route.ts
│       │       ├── members/
│       │       │   └── route.ts
│       │       └── tickets/                # NEW: House ticket public endpoints
│       │           └── [ticketId]/
│       │               └── route.ts        # Public ticket purchase
│       │
│       ├── tickets/                        # NEW: Public ticket API
│       │   ├── [ticketId]/
│       │   │   ├── route.ts                # GET ticket details
│       │   │   └── purchase/
│       │   │       └── route.ts            # POST purchase ticket
│       │   └── validate/
│       │       └── route.ts                # POST validate ticket (scanning)
│       │
│       ├── invitations/
│       │   ├── [token]/
│       │   │   └── route.ts
│       │   └── resend/
│       │       └── route.ts
│       │
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts
│       │
│       └── upload/
│           └── route.ts
│
├── components/
│   ├── admin/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignOutButton.tsx
│   │
│   ├── dashboard/
│   │   ├── DashboardHeader.tsx
│   │   ├── StatsCards.tsx
│   │   ├── QuickActions.tsx
│   │   └── RecentActivity.tsx
│   │
│   ├── organization/
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── house/                              # NEW: House-specific components
│   │   ├── HouseHeader.tsx                 # House header with role badge
│   │   ├── HouseSidebar.tsx                # House sidebar with role-based menu
│   │   ├── RoleBadge.tsx                   # Display member role
│   │   ├── RoleBasedMenu.tsx               # Menu items based on role
│   │   ├── MemberRoleManager.tsx           # Manage member roles
│   │   └── StaffSchedule.tsx               # Staff scheduling
│   │
│   ├── tickets/                            # NEW: Ticket components
│   │   ├── TicketCard.tsx                  # Ticket display card
│   │   ├── TicketForm.tsx                  # Create/edit ticket form
│   │   ├── TicketList.tsx                  # List of tickets
│   │   ├── TicketPurchaseModal.tsx         # Purchase ticket modal
│   │   ├── TicketScanner.tsx               # QR code scanner
│   │   ├── TicketValidator.tsx             # Validate ticket at entrance
│   │   ├── SalesChart.tsx                  # Ticket sales visualization
│   │   ├── PublicTicketPage.tsx            # Public ticket purchase page
│   │   └── TicketEmail.tsx                 # Ticket purchase email
│   │
│   ├── people/
│   │   ├── PeopleTable.tsx
│   │   ├── PeopleFilters.tsx
│   │   └── InviteMemberModal.tsx
│   │
│   ├── commerce/
│   │   ├── InvoicesTable.tsx
│   │   ├── InvoiceForm.tsx
│   │   └── SubscriptionPlans.tsx
│   │
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   ├── CalendarView.tsx
│   │   └── RSVPList.tsx
│   │
│   ├── memberships/
│   │   ├── MembershipsDashboard.tsx
│   │   ├── EnrollForm.tsx
│   │   └── CheckInScanner.tsx
│   │
│   ├── communications/
│   │   ├── CommunicationForm.tsx
│   │   ├── TemplateSelector.tsx
│   │   └── EmailStats.tsx
│   │
│   ├── reports/
│   │   ├── ReportBuilder.tsx
│   │   └── ReportViewer.tsx
│   │
│   └── ui/
│       ├── Alert.tsx
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Dropdown.tsx
│       ├── DropdownSimple.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Select.tsx
│       ├── Table.tsx
│       ├── Tabs.tsx
│       ├── LoadingSpinner.tsx
│       ├── QRCode.tsx                      # NEW: QR code generator
│       └── Scanner.tsx                     # NEW: QR code scanner
│
├── lib/
│   ├── auth/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   └── session.ts
│   │
│   ├── db/
│   │   ├── index.ts
│   │   
│   │
│   ├── email/
│   │   ├── index.ts
│   │   └── templates/
│   │       ├── invitation.ts
│   │       ├── welcome.ts
│   │       ├── invoice.ts
│   │       ├── reset-password.ts
│   │       └── ticket-purchase.ts          # NEW: Ticket purchase email
│   │
│   ├── permissions/
│   │   ├── index.ts
│   │   ├── roles.ts                        # UPDATED: Added House Staff and Manager roles
│   │   └── ticket-permissions.ts           # NEW: Ticket-specific permissions
│   │
│   ├── utils/
│   │   ├── tokens.ts
│   │   ├── encryption.ts
│   │   ├── settings.ts
│   │   ├── dates.ts
│   │   ├── validation.ts
│   │   └── qrcode.ts                       # NEW: QR code utilities
│   │
│   ├── stripe/
│   │   ├── client.ts
│   │   └── webhook.ts
│   │
│   ├── tickets/                            # NEW: Ticket utilities
│   │   ├── generator.ts                    # Generate unique ticket numbers
│   │   ├── validator.ts                    # Ticket validation logic
│   │   ├── pricing.ts                      # Dynamic pricing calculations
│   │   └── availability.ts                 # Ticket availability checks
│   │
│   └── validations/
│       ├── organization.ts
│       ├── house.ts
│       ├── event.ts
│       ├── invoice.ts
│       ├── user.ts
│       └── ticket.ts                       # NEW: Ticket validation schemas
│
├── types/
│   ├── next-auth.d.ts
│   ├── api.ts
│   ├── organization.ts
│   ├── house.ts                            # UPDATED: Added HouseStaff and HouseManager roles
│   ├── user.ts
│   ├── event.ts
│   ├── invoice.ts
│   └── ticket.ts                           # NEW: Ticket types
│
├── prisma/
│   ├── schema.prisma                       # UPDATED: Added new roles and ticket models
│   └── seed.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│── middleware.ts
├── middleware.ts
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── package.json
├── .env.local
├── .env.example
└── README.md