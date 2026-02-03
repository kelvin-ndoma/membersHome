// lib/db/middleware.ts
import { Prisma } from '@prisma/client'

// MongoDB doesn't support Prisma middleware for tenant isolation in the same way
// We'll implement manual tenant checks in our queries instead
export function withTenantContext<T>(
  fn: () => Promise<T>,
  tenantId?: string
): Promise<T> {
  // In MongoDB, we need to manually filter by tenantId in each query
  return fn()
}

// Helper to add tenant filter to where clause
export function addTenantFilter(
  where: any = {},
  tenantId?: string,
  tenantField: string = 'organizationId'
) {
  if (!tenantId) return where
  
  return {
    ...where,
    [tenantField]: tenantId
  }
}

// Helper to ensure tenant context for mutations
export function requireTenantContext(tenantId?: string) {
  if (!tenantId) {
    throw new Error('Tenant context is required for this operation')
  }
  return tenantId
}