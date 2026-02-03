// app/api/admin/organizations/[orgSlug]/houses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const houseSchema = z.object({
  name: z.string().min(1, "House name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

// POST /api/admin/organizations/[orgSlug]/houses - Create house (Platform Admin only)
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

    // Only platform admin can create houses
    if (!user || user.platformRole !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = houseSchema.safeParse(body);

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

    // Get organization
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if slug is unique within organization
    const existingHouse = await prisma.house.findFirst({
      where: {
        organizationId: organization.id,
        slug: validatedData.data.slug,
      },
    });

    if (existingHouse) {
      return NextResponse.json(
        { error: 'A house with this slug already exists in the organization' },
        { status: 400 }
      );
    }

    // Create house
    const house = await prisma.house.create({
      data: {
        name: validatedData.data.name,
        slug: validatedData.data.slug,
        description: validatedData.data.description,
        isPrivate: validatedData.data.isPrivate,
        organizationId: organization.id,
      },
    });

    return NextResponse.json(house, { status: 201 });
  } catch (error) {
    console.error('POST house error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}