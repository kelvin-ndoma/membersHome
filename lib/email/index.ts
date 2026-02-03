// lib/email/index.ts
interface OrganizationInviteEmailProps {
  to: string;
  organizationName: string;
  adminName: string;
  loginUrl: string;
}

export async function sendOrganizationInviteEmail({
  to,
  organizationName,
  adminName,
  loginUrl,
}: OrganizationInviteEmailProps) {
  // Simple console log for development
  console.log(`
    ===== EMAIL INVITATION (DEV MODE) =====
    To: ${to}
    Subject: Welcome to ${organizationName}!
    
    Hello ${adminName},
    
    You've been added as the Organization Owner of ${organizationName} on our platform.
    
    Login URL: ${loginUrl}
    
    ======================================
  `);
  
  return { success: true, id: 'mock-email-id' };
}