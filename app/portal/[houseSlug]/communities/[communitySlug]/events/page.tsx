// app/portal/[houseSlug]/communities/[communitySlug]/events/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  Plus,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Event {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  onlineUrl: string | null;
  startAt: string;
  endAt: string;
  isVirtual: boolean;
  requiresRSVP: boolean;
  maxAttendees: number | null;
  attendeeCount: number;
  status: string;
  organizer: {
    id: string;
    name: string;
    image: string | null;
  };
  userRSVP?: {
    status: string;
  };
}

export default function CommunityEventsPage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    fetchEvents();
  }, [communitySlug, filter]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/events?filter=${filter}`
      );
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);

    if (event.status === "CANCELLED") {
      return { text: "Cancelled", color: "bg-red-100 text-red-700" };
    }
    if (now < startDate) {
      return { text: "Upcoming", color: "bg-green-100 text-green-700" };
    }
    if (now >= startDate && now <= endDate) {
      return { text: "Ongoing", color: "bg-blue-100 text-blue-700" };
    }
    return { text: "Past", color: "bg-gray-100 text-gray-600" };
  };

  const canCreateEvent = true; // Check if user is admin/moderator

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Events</h1>
          <p className="text-gray-600 mt-1">
            Join events and connect with other members
          </p>
        </div>
        {canCreateEvent && (
          <Link
            href={`/portal/${houseSlug}/communities/${communitySlug}/events/create`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            <Plus className="h-5 w-5" />
            Create Event
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="flex gap-2">
            {["upcoming", "past", "all"].map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option as any)}
                className={`px-4 py-2 rounded-lg capitalize transition ${
                  filter === option
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500">
            {canCreateEvent
              ? "Be the first to create an event in this community!"
              : "Check back later for upcoming events."}
          </p>
          {canCreateEvent && (
            <Link
              href={`/portal/${houseSlug}/communities/${communitySlug}/events/create`}
              className="inline-block mt-4 text-purple-600 hover:text-purple-700"
            >
              Create an Event →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const status = getStatusBadge(event);
            const startDate = new Date(event.startAt);
            
            return (
              <Link
                key={event.id}
                href={`/portal/${houseSlug}/communities/${communitySlug}/events/${event.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition group"
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Date Box */}
                  <div className="flex-shrink-0 text-center">
                    <div className="w-16 bg-purple-600 rounded-lg overflow-hidden">
                      <div className="bg-purple-700 text-white text-xs py-1 font-medium">
                        {startDate.toLocaleString("default", { month: "short" })}
                      </div>
                      <div className="text-2xl font-bold text-white py-2">
                        {startDate.getDate()}
                      </div>
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                        {event.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {event.isVirtual ? (
                        <span className="flex items-center gap-1">
                          <Video className="h-4 w-4" />
                          Online Event
                        </span>
                      ) : event.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      ) : null}
                      {event.requiresRSVP && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.attendeeCount}{event.maxAttendees ? `/${event.maxAttendees}` : ""} attending
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {event.description || "No description provided"}
                    </p>
                  </div>

                  {/* RSVP Status */}
                  {event.userRSVP && (
                    <div className="flex-shrink-0">
                      {event.userRSVP.status === "CONFIRMED" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          RSVP'd
                        </span>
                      ) : event.userRSVP.status === "CANCELLED" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-red-600">
                          <XCircle className="h-4 w-4" />
                          Cancelled
                        </span>
                      ) : null}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}