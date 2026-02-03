// app/api/admin/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sendOrganizationInviteEmail } from '@/lib/email';

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  adminEmail: z.string().email("Valid email is required"),
  adminName: z.string().min(1, "Admin name is required"),
});

// Helper function to get IP from request
function getClientIp(request: NextRequest): string | undefined {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return undefined;
}

// POST /api/admin/organizations - Create new organization with admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Only platform admin can create organizations
    if (!adminUser || adminUser.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = organizationSchema.safeParse(body);

    if (!validatedData.success) {
      const errors = validatedData.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { name, slug, description, plan, adminEmail, adminName } = validatedData.data;

    // Check if slug is unique
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'An organization with this slug already exists' },
        { status: 400 }
      );
    }

    // Get client IP
    const clientIp = getClientIp(request);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create user
      let user = await tx.user.findUnique({
        where: { email: adminEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: adminEmail,
            name: adminName,
            platformRole: 'USER', // Fixed: Use 'USER' not 'MEMBER'
          },
        });
      }

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name,
          slug,
          description,
          plan: plan, // Fixed: Use enum value
          status: 'ACTIVE',
        },
      });

      // Create membership as ORG_OWNER
      const membership = await tx.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          organizationRole: 'ORG_OWNER',
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      // Create audit log - FIXED: Use correct schema
      await tx.auditLog.create({
        data: {
          userId: adminUser.id,
          userEmail: adminUser.email,
          userIp: clientIp || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          action: 'CREATE_ORGANIZATION',
          entityType: 'ORGANIZATION',
          entityId: organization.id,
          organizationId: organization.id,
          oldValues: null,
          newValues: {
            name,
            slug,
            plan,
            description,
            adminEmail,
            adminName,
          },
          metadata: {
            createdByPlatformAdmin: true,
            platformAdminEmail: adminUser.email,
          },
        },
      });

      return { organization, membership };
    });

    // Send invitation email
    await sendOrganizationInviteEmail({
      to: adminEmail,
      organizationName: name,
      adminName,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/`,
    });

    return NextResponse.json(result.organization, { status: 201 });
  } catch (error) {
    console.error('POST organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/organizations - List all organizations (Platform Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            memberships: {
              where: { status: 'ACTIVE' },
            },
            houses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('GET organizations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}