// app/api/organizations/[orgSlug]/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from "@/lib/db"
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email(),
  organizationRole: z.enum(['MEMBER', 'ORG_ADMIN']).default('MEMBER'),
  houseId: z.string().optional(),
  houseRole: z.enum(['HOUSE_MEMBER', 'HOUSE_ADMIN']).optional(),
});

// GET /api/organizations/[orgSlug]/members - List organization members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgSlug } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to this organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organization: { slug: orgSlug },
        status: 'ACTIVE',
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const members = await prisma.membership.findMany({
      where: {
        organization: { slug: orgSlug },
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        house: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('GET members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[orgSlug]/members - Invite new member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgSlug } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has admin/owner access to this organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        organization: { slug: orgSlug },
        status: 'ACTIVE',
        organizationRole: { in: ['ORG_ADMIN', 'ORG_OWNER'] },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = inviteSchema.safeParse(body);

    if (!validatedData.success) {
      // Get validation errors from issues property
      const errors = validatedData.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors
        }, 
        { status: 400 }
      );
    }

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user exists
    let invitedUser = await prisma.user.findUnique({
      where: { email: validatedData.data.email },
    });

    // Create user if doesn't exist
    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: {
          email: validatedData.data.email,
          name: validatedData.data.email.split('@')[0],
        },
      });
    }

    // Check if user is already a member
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: invitedUser.id,
        organizationId: organization.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Create membership
    const newMembership = await prisma.membership.create({
      data: {
        userId: invitedUser.id,
        organizationId: organization.id,
        houseId: validatedData.data.houseId,
        organizationRole: validatedData.data.organizationRole,
        houseRole: validatedData.data.houseRole,
        status: 'PENDING',
        invitedBy: user.id,
        invitationToken: crypto.randomUUID(),
        invitationSentAt: new Date(),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        house: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json(newMembership, { status: 201 });
  } catch (error) {
    console.error('POST members error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      // Prisma unique constraint error
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'Duplicate entry. User may already have a pending invitation.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}