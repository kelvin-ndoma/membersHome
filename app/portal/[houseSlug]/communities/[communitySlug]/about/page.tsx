// app/portal/[houseSlug]/communities/[communitySlug]/about/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Calendar,
  Lock,
  Globe,
  Shield,
  Crown,
  UserCheck,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Loader2,
  Edit2,
  Save,
  X,
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  logoUrl: string | null;
  isPrivate: boolean;
  requiresApproval: boolean;
  memberCount: number;
  postCount: number;
  memberRole?: "MEMBER" | "MODERATOR" | "ADMIN" | "OWNER";
  memberStatus?: "ACTIVE" | "PENDING";
  createdAt?: string;
}

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  joinedAt: string;
}

export default function CommunityAboutPage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [owners, setOwners] = useState<Member[]>([]);
  const [admins, setAdmins] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);

  useEffect(() => {
    fetchCommunityAndMembers();
  }, [communitySlug]);

  const fetchCommunityAndMembers = async () => {
    try {
      const [communityRes, membersRes] = await Promise.all([
        fetch(`/api/portal/${houseSlug}/communities/${communitySlug}`),
        fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/members?limit=50`),
      ]);

      const communityData = await communityRes.json();
      const membersData = await membersRes.json();

      if (communityData.success) {
        setCommunity(communityData.community);
        setEditDescription(communityData.community.description || "");
        console.log("Community role:", communityData.community.memberRole); // Debug log
      }

      if (membersData.success) {
        setMembers(membersData.members);
        // Filter owners and admins
        const ownersList = membersData.members.filter((m: Member) => m.role === "OWNER");
        const adminsList = membersData.members.filter((m: Member) => m.role === "ADMIN");
        setOwners(ownersList);
        setAdmins(adminsList);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href.replace("/about", "");
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDescription = async () => {
    if (!community) return;
    
    setSavingDescription(true);
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${community.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: editDescription,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setCommunity({ ...community, description: editDescription });
        setIsEditingDescription(false);
      } else {
        alert(data.error || "Failed to update description");
      }
    } catch (error) {
      console.error("Failed to save description:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSavingDescription(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Community not found
        </h2>
        <p className="text-gray-600">
          The community you're looking for doesn't exist
        </p>
      </div>
    );
  }

  const isOwner = community.memberRole === "OWNER";
  const isAdmin = isOwner || community.memberRole === "ADMIN";
  const canEdit = isOwner || isAdmin;

  // Debug info - remove in production
  console.log("Member role:", community.memberRole);
  console.log("Can edit:", canEdit);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Community
      </button>

      {/* Debug banner - remove in production */}
      {!canEdit && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <p>You are viewing as: {community.memberRole || "Not a member"}</p>
          <p>Edit button is only visible to Owners and Admins</p>
        </div>
      )}

      {/* Header with share button */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md">
              {community.logoUrl ? (
                <img
                  src={community.logoUrl}
                  alt=""
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <Users className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {community.name}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Community information
              </p>
            </div>
          </div>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-purple-600 border border-gray-300 rounded-lg hover:border-purple-300 transition"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                Share
              </>
            )}
          </button>
        </div>

        {/* Description - Editable */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-700">Description</h2>
            {canEdit && !isEditingDescription && (
              <button
                onClick={() => setIsEditingDescription(true)}
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 transition"
              >
                <Edit2 className="h-3 w-3" />
                Edit Description
              </button>
            )}
          </div>
          
          {isEditingDescription ? (
            <div className="space-y-3">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                placeholder="Describe your community..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsEditingDescription(false);
                    setEditDescription(community.description || "");
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <X className="h-4 w-4 inline mr-1" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveDescription}
                  disabled={savingDescription}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {savingDescription ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 inline mr-1" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {community.description || "No description provided."}
            </p>
          )}
        </div>

        {/* Community Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Users className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {community.memberCount}
            </div>
            <div className="text-xs text-gray-500">Members</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <MessageSquare className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {community.postCount}
            </div>
            <div className="text-xs text-gray-500">Posts</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <Calendar className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-900">
              {formatDate(community.createdAt)}
            </div>
            <div className="text-xs text-gray-500">Created</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-xl">
            {community.isPrivate ? (
              <Lock className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            ) : (
              <Globe className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            )}
            <div className="text-sm font-medium text-gray-900">
              {community.isPrivate ? "Private" : "Public"}
            </div>
            <div className="text-xs text-gray-500">Privacy</div>
          </div>
        </div>

        {/* Community Details */}
        <div className="border-t border-gray-200 pt-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Community Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Privacy</span>
              <span className="text-gray-900 font-medium">
                {community.isPrivate ? (
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Private - Only members can see content
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" />
                    Public - Anyone can see content
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Member Approval</span>
              <span className="text-gray-900 font-medium">
                {community.requiresApproval ? (
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Required - Join requests need approval
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Not required - Anyone can join
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-900 font-medium">
                {formatDate(community.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        {canEdit && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h2 className="text-sm font-medium text-gray-700 mb-3">
              Admin Controls
            </h2>
            <div className="flex gap-3">
              <Link
                href={`/portal/${houseSlug}/communities/${communitySlug}/settings`}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Edit Community Settings →
              </Link>
              {isOwner && (
                <Link
                  href={`/portal/${houseSlug}/communities/${communitySlug}/members?pending=true`}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Manage Join Requests →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Owners Section */}
      {owners.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Community Owners</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {owners.map((owner) => (
              <div
                key={owner.id}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-transparent rounded-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {owner.image ? (
                    <img
                      src={owner.image}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-base font-medium">
                      {owner.name?.[0] || owner.email?.[0] || "O"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{owner.name}</p>
                  <p className="text-sm text-gray-500">{owner.email}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-600 mt-1">
                    <Crown className="h-3 w-3" />
                    Community Owner
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admins Section */}
      {admins.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Community Admins</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex items-center gap-3 p-3 bg-purple-50/30 rounded-xl"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {admin.image ? (
                    <img
                      src={admin.image}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-base font-medium">
                      {admin.name?.[0] || admin.email?.[0] || "A"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{admin.name}</p>
                  <p className="text-sm text-gray-500">{admin.email}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-purple-600 mt-1">
                    <Shield className="h-3 w-3" />
                    Community Admin
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              All Members
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {community.memberCount} total members
            </p>
          </div>
          <Link
            href={`/portal/${houseSlug}/communities/${communitySlug}/members`}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            View All ({community.memberCount})
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {members.slice(0, 6).map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                {member.image ? (
                  <img
                    src={member.image}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {member.name?.[0] || member.email?.[0] || "M"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {member.role === "OWNER" && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600">
                      <Crown className="h-3 w-3" />
                      Owner
                    </span>
                  )}
                  {member.role === "ADMIN" && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-purple-600">
                      <Shield className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                  {member.role === "MODERATOR" && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-blue-600">
                      <Shield className="h-3 w-3" />
                      Moderator
                    </span>
                  )}
                  {member.role === "MEMBER" && (
                    <span className="text-xs text-gray-500">Member</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No members yet</p>
          </div>
        )}

        {members.length > 0 && members.length < community.memberCount && (
          <div className="text-center mt-6">
            <Link
              href={`/portal/${houseSlug}/communities/${communitySlug}/members`}
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
            >
              View all {community.memberCount} members →
            </Link>
          </div>
        )}

        {/* Call to action for non-members */}
        {community.memberStatus !== "ACTIVE" && (
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm mb-3">
              Join this community to connect with other members
            </p>
            <Link
              href={`/portal/${houseSlug}/communities/${communitySlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Users className="h-4 w-4" />
              Go to Community
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}