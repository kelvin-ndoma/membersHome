// app/org/[orgSlug]/houses/[houseSlug]/communications/templates/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth.config'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  FileText,
  Mail,
  Megaphone,
  Send,
} from 'lucide-react'

interface TemplatesPageProps {
  params: {
    orgSlug: string
    houseSlug: string
  }
}

// For now, templates are stored in a simple JSON structure in the house settings
// Later you can create a proper Template model

const defaultTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Message',
    type: 'EMAIL',
    subject: 'Welcome to {{houseName}}!',
    body: `<p>Hi {{memberName}},</p>
<p>Welcome to {{houseName}}! We're thrilled to have you as a member.</p>
<p>Here are some things you can do:</p>
<ul>
  <li>Browse upcoming events</li>
  <li>Connect with other members in the directory</li>
  <li>Update your profile</li>
</ul>
<p>Get started by visiting your member portal:</p>
<p><a href="{{portalUrl}}">{{portalUrl}}</a></p>
<p>Best regards,<br>{{houseName}} Team</p>`,
  },
  {
    id: 'event-reminder',
    name: 'Event Reminder',
    type: 'EMAIL',
    subject: 'Reminder: {{eventName}} is tomorrow!',
    body: `<p>Hi {{memberName}},</p>
<p>This is a friendly reminder that <strong>{{eventName}}</strong> is happening tomorrow!</p>
<p><strong>Date:</strong> {{eventDate}}<br><strong>Time:</strong> {{eventTime}}<br><strong>Location:</strong> {{eventLocation}}</p>
<p>We look forward to seeing you there!</p>
<p>Best regards,<br>{{houseName}} Team</p>`,
  },
  {
    id: 'payment-receipt',
    name: 'Payment Receipt',
    type: 'EMAIL',
    subject: 'Payment Receipt - {{houseName}}',
    body: `<p>Hi {{memberName}},</p>
<p>Thank you for your payment!</p>
<p><strong>Amount:</strong> {{amount}}<br><strong>Date:</strong> {{paymentDate}}<br><strong>Transaction ID:</strong> {{transactionId}}</p>
<p>This email serves as your receipt.</p>
<p>Best regards,<br>{{houseName}} Team</p>`,
  },
  {
    id: 'announcement',
    name: 'General Announcement',
    type: 'ANNOUNCEMENT',
    subject: '{{subject}}',
    body: `<h2>{{title}}</h2>
<p>{{message}}</p>
<p>— {{houseName}} Team</p>`,
  },
]

export default async function TemplatesPage({ params }: TemplatesPageProps) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login')
  }

  const house = await prisma.house.findFirst({
    where: {
      slug: params.houseSlug,
      organization: { slug: params.orgSlug }
    }
  })

  if (!house) {
    return <div>House not found</div>
  }

  // Get custom templates from house settings
  const settings = house.settings as any
  const customTemplates = settings?.communicationTemplates || []
  const allTemplates = [...defaultTemplates, ...customTemplates]

  const typeIcons: Record<string, any> = {
    EMAIL: Mail,
    ANNOUNCEMENT: Megaphone,
    PUSH_NOTIFICATION: Send,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage templates for quick communications
          </p>
        </div>
        <Link
          href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/templates/create`}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          New Template
        </Link>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {allTemplates.map((template) => {
          const TypeIcon = typeIcons[template.type] || Mail
          const isDefault = defaultTemplates.some(t => t.id === template.id)
          
          return (
            <div key={template.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TypeIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-xs text-gray-500">{template.type}</p>
                    </div>
                  </div>
                  {isDefault && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Subject:</strong> {template.subject}
                </p>
                
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                  {template.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                </p>
                
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Link
                    href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/create?template=${template.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                  >
                    <Copy className="h-4 w-4" />
                    Use Template
                  </Link>
                  
                  {!isDefault && (
                    <>
                      <Link
                        href={`/org/${params.orgSlug}/houses/${params.houseSlug}/communications/templates/${template.id}/edit`}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Variables Reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Available Variables</h2>
        <p className="text-sm text-gray-500 mb-4">
          Use these variables in your templates. They will be replaced with actual values when sending.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { variable: '{{memberName}}', description: "Member's full name" },
            { variable: '{{memberEmail}}', description: "Member's email address" },
            { variable: '{{houseName}}', description: 'Name of the house' },
            { variable: '{{orgName}}', description: 'Name of the organization' },
            { variable: '{{portalUrl}}', description: 'Link to member portal' },
            { variable: '{{eventName}}', description: 'Name of the event' },
            { variable: '{{eventDate}}', description: 'Date of the event' },
            { variable: '{{eventTime}}', description: 'Time of the event' },
            { variable: '{{eventLocation}}', description: 'Location of the event' },
          ].map((v) => (
            <div key={v.variable} className="p-3 bg-gray-50 rounded-lg">
              <code className="text-sm font-mono text-purple-600">{v.variable}</code>
              <p className="text-xs text-gray-500 mt-1">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}