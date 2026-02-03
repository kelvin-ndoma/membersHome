// components/dashboard/RecentActivity.tsx
import { Calendar, User, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

interface RecentActivityProps {
  title: string;
  items: any[];
  type: 'members' | 'events';
  orgSlug: string;
}

export default function RecentActivity({ title, items, type, orgSlug }: RecentActivityProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Button
            href={`/organization/${orgSlug}/${type}`}
            variant="ghost"
            size="sm"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      <div className="divide-y">
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No {type} found
          </div>
        ) : (
          items.map((item, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              {type === 'members' ? (
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {item.user.image ? (
                      <img
                        src={item.user.image}
                        alt={item.user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.user.name || item.user.email}
                    </p>
                    <p className="text-sm text-gray-500">{item.user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Joined {formatDate(item.joinedAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {item.title}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{item.house?.name}</span>
                      <span>•</span>
                      <span>{item._count?.rsvps || 0} attendees</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {formatDate(item.startDate)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.type.toLowerCase()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}