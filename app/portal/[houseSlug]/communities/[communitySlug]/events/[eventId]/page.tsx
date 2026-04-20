// app/portal/[houseSlug]/communities/[communitySlug]/events/[eventId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Share2,
  Copy,
  Check,
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
    id: string;
    status: string;
  };
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/events/${eventId}`
      );
      const data = await response.json();
      if (data.success) {
        setEvent(data.event);
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (status: "CONFIRMED" | "CANCELLED") => {
    setRsvpLoading(true);
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/events/${eventId}/rsvp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      const data = await response.json();
      if (data.success) {
        fetchEvent();
      } else {
        alert(data.error || "Failed to update RSVP");
      }
    } catch (error) {
      console.error("Failed to update RSVP:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
        <button
          onClick={() => router.back()}
          className="text-purple-600 hover:text-purple-700"
        >
          Go Back →
        </button>
      </div>
    );
  }

  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);
  const isUpcoming = new Date() < startDate;
  const isOngoing = new Date() >= startDate && new Date() <= endDate;
  const isPast = new Date() > endDate;
  const isOrganizer = false; // Check if current user is organizer
  const canRSVP = isUpcoming && event.requiresRSVP && event.status !== "CANCELLED";
  const userRSVPStatus = event.userRSVP?.status;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </button>

      {/* Event Header */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <User className="h-4 w-4" />
                  Hosted by {event.organizer.name}
                </div>
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              {copied ? <Check className="h-5 w-5 text-green-600" /> : <Share2 className="h-5 w-5" />}
            </button>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium text-gray-900">
                  {startDate.toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-sm text-gray-500">
                  {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {event.isVirtual ? (
                <Video className="h-5 w-5 text-purple-600" />
              ) : (
                <MapPin className="h-5 w-5 text-purple-600" />
              )}
              <div>
                <p className="text-sm text-gray-500">Location</p>
                {event.isVirtual ? (
                  <>
                    <p className="font-medium text-gray-900">Online Event</p>
                    {event.onlineUrl && (
                      <a
                        href={event.onlineUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline"
                      >
                        Join Meeting Link →
                      </a>
                    )}
                  </>
                ) : (
                  <p className="font-medium text-gray-900">{event.location || "TBD"}</p>
                )}
              </div>
            </div>

            {event.requiresRSVP && (
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-500">Attendees</p>
                  <p className="font-medium text-gray-900">
                    {event.attendeeCount} {event.maxAttendees ? `/ ${event.maxAttendees}` : ""} going
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                    event.status === "CANCELLED"
                      ? "bg-red-100 text-red-700"
                      : isPast
                      ? "bg-gray-100 text-gray-600"
                      : isOngoing
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {event.status === "CANCELLED"
                    ? "Cancelled"
                    : isPast
                    ? "Past"
                    : isOngoing
                    ? "Ongoing"
                    : "Upcoming"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About this event</h2>
          <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
            {event.description}
          </p>
        </div>
      )}

      {/* RSVP Section */}
      {event.requiresRSVP && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">RSVP</h2>
          
          {userRSVPStatus ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {userRSVPStatus === "CONFIRMED" ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-700 font-medium">You're going!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700 font-medium">You're not going</span>
                  </>
                )}
              </div>
              {canRSVP && (
                <button
                  onClick={() =>
                    handleRSVP(userRSVPStatus === "CONFIRMED" ? "CANCELLED" : "CONFIRMED")
                  }
                  disabled={rsvpLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {rsvpLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : userRSVPStatus === "CONFIRMED" ? (
                    "Cancel RSVP"
                  ) : (
                    "RSVP to Attend"
                  )}
                </button>
              )}
            </div>
          ) : canRSVP ? (
            <button
              onClick={() => handleRSVP("CONFIRMED")}
              disabled={rsvpLoading}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {rsvpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "RSVP to Attend"}
            </button>
          ) : !isUpcoming ? (
            <p className="text-gray-500">This event has already ended.</p>
          ) : event.status === "CANCELLED" ? (
            <p className="text-red-600">This event has been cancelled.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}