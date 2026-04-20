// app/portal/[houseSlug]/communities/[communitySlug]/events/create/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  Globe,
  Lock,
  Loader2,
  Save,
} from "lucide-react";

export default function CreateEventPage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    onlineUrl: "",
    startAt: "",
    endAt: "",
    isVirtual: false,
    requiresRSVP: true,
    maxAttendees: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.startAt || !formData.endAt) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/events`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            location: formData.isVirtual ? null : formData.location,
            onlineUrl: formData.isVirtual ? formData.onlineUrl : null,
            startAt: formData.startAt,
            endAt: formData.endAt,
            isVirtual: formData.isVirtual,
            requiresRSVP: formData.requiresRSVP,
            maxAttendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        router.push(`/portal/${houseSlug}/communities/${communitySlug}/events`);
      } else {
        alert(data.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Event</h1>
        <p className="text-gray-600 mt-1">Plan and organize community events</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Weekly Meetup, Workshop, Webinar"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe what the event is about..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startAt}
                  onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.endAt}
                  onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location Type */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

          <div className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!formData.isVirtual}
                  onChange={() => setFormData({ ...formData, isVirtual: false })}
                  className="text-purple-600"
                />
                <MapPin className="h-4 w-4" />
                <span>In-Person</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.isVirtual}
                  onChange={() => setFormData({ ...formData, isVirtual: true })}
                  className="text-purple-600"
                />
                <Video className="h-4 w-4" />
                <span>Online</span>
              </label>
            </div>

            {!formData.isVirtual ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Community Center, 123 Main St"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Online Meeting Link
                </label>
                <input
                  type="url"
                  value={formData.onlineUrl}
                  onChange={(e) => setFormData({ ...formData, onlineUrl: e.target.value })}
                  placeholder="https://zoom.us/... or https://meet.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* RSVP Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">RSVP Settings</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.requiresRSVP}
                onChange={(e) => setFormData({ ...formData, requiresRSVP: e.target.checked })}
                className="rounded text-purple-600"
              />
              <div>
                <span className="font-medium text-gray-900">Require RSVP</span>
                <p className="text-sm text-gray-500">Track who is attending</p>
              </div>
            </label>

            {formData.requiresRSVP && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Attendees (Optional)
                </label>
                <input
                  type="number"
                  value={formData.maxAttendees}
                  onChange={(e) => setFormData({ ...formData, maxAttendees: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Event
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}