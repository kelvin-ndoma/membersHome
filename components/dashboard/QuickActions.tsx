// components/dashboard/QuickActions.tsx
import { UserPlus, FileText, CheckSquare, UserCheck } from 'lucide-react';
import Button from '../ui/Button';

interface QuickActionsProps {
  orgSlug: string;
  userRole: string;
}

export default function QuickActions({ orgSlug, userRole }: QuickActionsProps) {
  const actions = [
    {
      title: 'Register Person',
      description: 'Add a new member or contact',
      icon: UserPlus,
      href: `/organization/${orgSlug}/people/create`,
      color: 'bg-blue-100 text-blue-600',
      requiresAdmin: false,
    },
    {
      title: 'Create Invoice',
      description: 'Generate and send an invoice',
      icon: FileText,
      href: `/organization/${orgSlug}/commerce/invoices/create`,
      color: 'bg-green-100 text-green-600',
      requiresAdmin: true,
    },
    {
      title: 'Check-in Member',
      description: 'Record member attendance',
      icon: CheckSquare,
      href: `/organization/${orgSlug}/memberships/check-in`,
      color: 'bg-purple-100 text-purple-600',
      requiresAdmin: false,
    },
    {
      title: 'Enroll a Member',
      description: 'Add someone to a membership plan',
      icon: UserCheck,
      href: `/organization/${orgSlug}/memberships/enroll`,
      color: 'bg-indigo-100 text-indigo-600',
      requiresAdmin: true,
    },
  ];

  const isAdmin = userRole === 'ORG_ADMIN' || userRole === 'ORG_OWNER';

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions
          .filter(action => !action.requiresAdmin || isAdmin)
          .map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                href={action.href}
                variant="ghost"
                className="h-auto p-4 text-left hover:bg-gray-50 border border-gray-200"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                  </div>
                </div>
              </Button>
            );
          })}
      </div>
    </div>
  );
}