// app/api/organizations/[orgSlug]/route.ts - Simpler version
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from "@/lib/db";

// Helper function to get params
async function getParams(params: Promise<{ orgSlug: string }>) {
  return await params;
}

// GET /api/organizations/[orgSlug] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgSlug } = await getParams(params);

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
      include: {
        organization: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ 
        error: 'Organization not found or access denied' 
      }, { status: 404 });
    }

    return NextResponse.json(membership.organization);
  } catch (error) {
    console.error('GET organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[orgSlug] - Update organization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgSlug } = await getParams(params);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has admin/owner access
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
    
    // Simple validation
    const updateData: any = {};
    if (body.name && typeof body.name === 'string') updateData.name = body.name;
    if (body.description && typeof body.description === 'string') updateData.description = body.description;
    if (body.logoUrl && typeof body.logoUrl === 'string') updateData.logoUrl = body.logoUrl;
    if (body.website && typeof body.website === 'string') updateData.website = body.website;
    if (body.primaryColor && typeof body.primaryColor === 'string') updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor && typeof body.secondaryColor === 'string') updateData.secondaryColor = body.secondaryColor;
    if (body.settings) updateData.settings = body.settings;

    const organization = await prisma.organization.update({
      where: { slug: orgSlug },
      data: updateData,
    });

    return NextResponse.json(organization);
  } catch (error) {
    console.error('PUT organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[orgSlug] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgSlug } = await getParams(params);

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.organization.update({
      where: { slug: orgSlug },
      data: { 
        status: 'CANCELLED', 
        suspendedAt: new Date() 
      },
    });

    return NextResponse.json({ 
      message: 'Organization deleted successfully' 
    });
  } catch (error) {
    console.error('DELETE organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}