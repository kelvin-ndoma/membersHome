// app/api/organizations/[orgSlug]/commerce/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from "@/lib/db"
import { z } from 'zod';

const invoiceSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional().or(z.null()),
  items: z.array(z.object({
    description: z.string().min(1, "Item description is required"),
    quantity: z.number().positive("Quantity must be positive"),
    unitPrice: z.number().positive("Unit price must be positive"),
  })).optional().default([]),
});

// Define valid invoice statuses from your schema
const validInvoiceStatuses = [
  'DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'
] as const;

type InvoiceStatus = typeof validInvoiceStatuses[number];

// GET /api/organizations/[orgSlug]/commerce/invoices - List invoices
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

    // Get organization to use its ID
    const organization = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Validate status parameter against InvoiceStatus enum
    let statusFilter: InvoiceStatus | undefined;
    if (statusParam && validInvoiceStatuses.includes(statusParam as InvoiceStatus)) {
      statusFilter = statusParam as InvoiceStatus;
    }

    // Build the where clause with proper type checking
    const where: any = {
      organizationId: organization.id,
    };

    if (statusFilter) {
      where.status = statusFilter;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          member: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET invoices error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/organizations/[orgSlug]/commerce/invoices - Create invoice
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

    // Check if user has permission to create invoices
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
    
    // Use safeParse instead of parse
    const validatedData = invoiceSchema.safeParse(body);

    if (!validatedData.success) {
      // Get validation errors properly
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
      select: { id: true },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if member exists and belongs to the organization
    const member = await prisma.membership.findFirst({
      where: {
        id: validatedData.data.memberId,
        organizationId: organization.id,
        status: 'ACTIVE',
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found or not active in this organization' },
        { status: 404 }
      );
    }

    // Generate invoice number
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const invoiceNumber = `INV-${timestamp}-${random}`.toUpperCase();

    // Calculate total from items if provided
    const totalAmount = validatedData.data.items && validatedData.data.items.length > 0
      ? validatedData.data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
      : validatedData.data.amount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId: organization.id,
        memberId: validatedData.data.memberId,
        amount: totalAmount,
        currency: validatedData.data.currency,
        description: validatedData.data.description,
        dueDate: validatedData.data.dueDate ? new Date(validatedData.data.dueDate) : null,
        items: validatedData.data.items,
        status: 'DRAFT',
        createdBy: user.id,
      },
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('POST invoice error:', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      // Prisma errors
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { error: 'Invoice number already exists. Please try again.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Foreign key constraint failed')) {
        return NextResponse.json(
          { error: 'Invalid member or organization reference' },
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

// PATCH /api/organizations/[orgSlug]/commerce/invoices/[invoiceId] - Update invoice status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; invoiceId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orgSlug, invoiceId } = await params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to update invoices
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
    const { status, paidAt } = body;

    // Validate status
    if (status && !validInvoiceStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid invoice status' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paidAt) updateData.paidAt = new Date(paidAt);
    if (status === 'PAID' && !paidAt) updateData.paidAt = new Date();
    if (status === 'PAID') updateData.paidBy = user.id;

    const invoice = await prisma.invoice.update({
      where: {
        id: invoiceId,
        organization: { slug: orgSlug },
      },
      data: updateData,
      include: {
        member: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('PATCH invoice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}