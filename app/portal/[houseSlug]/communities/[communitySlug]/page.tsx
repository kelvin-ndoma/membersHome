// app/portal/[houseSlug]/communities/[communitySlug]/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  ThumbsUp,
  MessageCircle,
  Repeat2,
  X,
  Lock,
  UserCheck,
  Info,
  ShoppingBag,
  Video,
  Calendar,
  UserPlus,
  Globe,
  Camera,
  Upload,
  Loader2,
  Crown,
  Shield,
  Share2,
  Copy,
  Check,
  Package,
  Download,
  Heart,
  TrendingUp,
  DollarSign,
  Grid3x3,
  List,
  Filter,
  ChevronDown,
  Plus,
  Search,
  MapPin,
  Clock,
  ChevronRight,
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

interface Post {
  id: string;
  content: string;
  type: string;
  mediaUrls: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isPinned: boolean;
  isAnnouncement: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  likedByUser: boolean;
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

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  type: "PHYSICAL" | "DIGITAL" | "SERVICE" | "DONATION";
  category: string | null;
  images: string[];
  salesCount: number;
  seller: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
}

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

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "feed" | "about" | "members" | "marketplace" | "live" | "events"
  >("feed");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState<
    "logo" | "cover" | null
  >(null);
  const [copied, setCopied] = useState(false);

  // Marketplace state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (communitySlug) {
      fetchCommunity();
      fetchPosts();
      fetchMembers();
      fetchProducts();
    }
  }, [communitySlug, selectedCategory]);

  useEffect(() => {
    if (communitySlug && activeTab === "events") {
      fetchEvents();
    }
  }, [communitySlug, activeTab, eventFilter]);

  const fetchCommunity = async () => {
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}`
      );
      const data = await response.json();

      if (data.success) {
        setCommunity(data.community);
      } else if (data.requiresJoin) {
        setShowJoinModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch community:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/posts`
      );
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/members?limit=9`
      );
      const data = await response.json();

      if (data.success) {
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/products?${params}`
      );
      const data = await response.json();

      if (data.success) {
        setProducts(data.products);
        setCategories(data.categories || []);
        setMarketplaceStats(data.stats || { totalProducts: 0, totalSales: 0, totalRevenue: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setProductsLoading(false);
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${communitySlug}/events?filter=${eventFilter}`
      );
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setEventsLoading(false);
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File, type: "logo" | "cover") => {
    if (type === "logo") {
      setUploadingLogo(true);
    } else {
      setUploadingCover(true);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "communities");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const uploadData = await uploadResponse.json();

      if (!uploadData.url) {
        throw new Error("No URL returned from upload");
      }

      const updateResponse = await fetch(
        `/api/portal/${houseSlug}/communities/${community?.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [type === "logo" ? "logoUrl" : "coverImage"]: uploadData.url,
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Update failed");
      }

      const updateData = await updateResponse.json();

      if (updateData.success) {
        setCommunity((prev) =>
          prev
            ? {
                ...prev,
                [type === "logo" ? "logoUrl" : "coverImage"]: uploadData.url,
              }
            : null
        );
        alert(
          `${type === "logo" ? "Profile picture" : "Cover image"} updated successfully!`
        );
      } else {
        throw new Error(updateData.error || "Update failed");
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert(
        `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      if (type === "logo") {
        setUploadingLogo(false);
      } else {
        setUploadingCover(false);
      }
      setShowImageUpload(null);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim() && mediaFiles.length === 0) return;

    setUploading(true);
    try {
      let uploadedUrls: string[] = [];
      if (mediaFiles.length > 0) {
        const formData = new FormData();
        mediaFiles.forEach((file) => formData.append("files", file));
        formData.append("folder", "posts");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        uploadedUrls = uploadData.url ? [uploadData.url] : [];
      }

      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${community?.id}/posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newPost,
            mediaUrls: uploadedUrls,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setNewPost("");
        setMediaFiles([]);
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${community?.id}/posts/${postId}/like`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likesCount: data.liked
                    ? post.likesCount + 1
                    : post.likesCount - 1,
                  likedByUser: data.liked,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleJoinCommunity = async () => {
    try {
      const response = await fetch(
        `/api/portal/${houseSlug}/communities/${community?.id}/join`,
        {
          method: "POST",
        }
      );

      const data = await response.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error || "Failed to join community");
      }
    } catch (error) {
      console.error("Failed to join community:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SERVICE": return <MessageCircle className="h-4 w-4" />;
      case "DIGITAL": return <Download className="h-4 w-4" />;
      case "DONATION": return <Heart className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getEventStatusBadge = (event: Event) => {
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!community && showJoinModal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-10 w-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Private Community
          </h2>
          <p className="text-gray-600 mb-6">
            This community is private. Request access to join and see posts.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleJoinCommunity}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Request to Join
            </button>
            <button
              onClick={() => router.push(`/portal/${houseSlug}/communities`)}
              className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Communities
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Community not found
          </h2>
          <p className="text-gray-600 mb-4">
            The community you're looking for doesn't exist
          </p>
          <button
            onClick={() => router.push(`/portal/${houseSlug}/communities`)}
            className="text-purple-600 hover:text-purple-700"
          >
            Browse Communities →
          </button>
        </div>
      </div>
    );
  }

  const isModerator =
    community.memberRole === "ADMIN" ||
    community.memberRole === "OWNER" ||
    community.memberRole === "MODERATOR";
  const isMember = community.memberStatus === "ACTIVE";
  const isOwner = community.memberRole === "OWNER";
  const isAdmin = isOwner || community.memberRole === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-purple-600 to-pink-600">
        {community.coverImage && (
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Upload Cover Button (Moderators only) */}
        {isModerator && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={() => setShowImageUpload("cover")}
              disabled={uploadingCover}
              className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 hover:bg-black/70 transition disabled:opacity-50"
            >
              {uploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {uploadingCover ? "Uploading..." : "Change Cover"}
            </button>
          </div>
        )}

        {/* Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push(`/portal/${houseSlug}/communities`)}
              className="text-white hover:text-gray-200 flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Communities
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="text-white hover:text-gray-200 p-2 bg-black/30 rounded-lg backdrop-blur-sm"
                title="Share"
              >
                {copied ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Share2 className="h-5 w-5" />
                )}
              </button>
              {isModerator && (
                <Link
                  href={`/portal/${houseSlug}/communities/${communitySlug}/settings`}
                  className="text-white hover:text-gray-200 p-2 bg-black/30 rounded-lg backdrop-blur-sm"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Community Info Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-12 pb-4">
            {/* Profile Image */}
            <div className="relative group">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
                {community.logoUrl ? (
                  <img
                    src={community.logoUrl}
                    alt=""
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <Users className="h-12 w-12 text-white" />
                )}
              </div>

              {/* Upload Logo Button (Moderators only) */}
              {isModerator && (
                <button
                  onClick={() => setShowImageUpload("logo")}
                  disabled={uploadingLogo}
                  className="absolute bottom-0 right-0 bg-purple-600 text-white p-1.5 rounded-full shadow-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Camera className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>

            {/* Community Name and Stats */}
            <div className="pb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {community.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {community.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {community.postCount} posts
                </span>
                {community.isPrivate && (
                  <span className="flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    Private
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowImageUpload(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload{" "}
              {showImageUpload === "logo" ? "Profile Picture" : "Cover Image"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {showImageUpload === "logo"
                ? "Recommended size: 400x400 pixels. Max 5MB."
                : "Recommended size: 1200x400 pixels. Max 5MB."}
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Click or drag to upload
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(e.target.files[0], showImageUpload);
                  }
                }}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </label>
            </div>
            <button
              onClick={() => setShowImageUpload(null)}
              className="mt-4 w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab("feed")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "feed"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Feed
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "about"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Info className="h-4 w-4" />
              About
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "members"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Users className="h-4 w-4" />
              Members
            </button>
            <button
              onClick={() => setActiveTab("marketplace")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "marketplace"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Marketplace
            </button>
            <button
              onClick={() => setActiveTab("live")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "live"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Video className="h-4 w-4" />
              Live
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 ${
                activeTab === "events"
                  ? "border-purple-600 text-purple-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              <Calendar className="h-4 w-4" />
              Events
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content - Tab Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Feed Tab */}
        {activeTab === "feed" && (
          <>
            {/* Create Post */}
            {isMember && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {/* User initial will go here */}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={`Share something with ${community.name}...`}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    />

                    {/* Media Preview */}
                    {mediaFiles.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {mediaFiles.map((file, index) => (
                          <div key={index} className="relative w-20 h-20">
                            <img
                              src={URL.createObjectURL(file)}
                              alt="Preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <button
                              onClick={() =>
                                setMediaFiles((prev) =>
                                  prev.filter((_, i) => i !== index)
                                )
                              }
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        >
                          <ImageIcon className="h-5 w-5" />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setMediaFiles(Array.from(e.target.files));
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={handleCreatePost}
                        disabled={
                          (!newPost.trim() && mediaFiles.length === 0) ||
                          uploading
                        }
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                            Posting...
                          </>
                        ) : (
                          "Post"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Posts */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                        {post.author.image ? (
                          <img
                            src={post.author.image}
                            alt=""
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-medium">
                            {post.author.name?.[0] || "U"}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {post.author.name}
                          </span>
                          {post.isAnnouncement && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                              Announcement
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.mediaUrls.length > 0 && (
                      <div
                        className={`grid gap-2 mt-3 ${
                          post.mediaUrls.length === 1
                            ? "grid-cols-1"
                            : post.mediaUrls.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-3"
                        }`}
                      >
                        {post.mediaUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt=""
                            className="rounded-lg object-cover w-full h-48"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 text-sm transition ${
                        post.likedByUser
                          ? "text-purple-600"
                          : "text-gray-500 hover:text-purple-600"
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {post.likesCount > 0 && <span>{post.likesCount}</span>}
                    </button>

                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition">
                      <MessageCircle className="h-4 w-4" />
                      {post.commentsCount > 0 && (
                        <span>{post.commentsCount}</span>
                      )}
                    </button>

                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition">
                      <Repeat2 className="h-4 w-4" />
                      {post.sharesCount > 0 && <span>{post.sharesCount}</span>}
                    </button>
                  </div>
                </div>
              ))}

              {posts.length === 0 && isMember && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No posts yet
                  </h3>
                  <p className="text-gray-500">
                    Be the first to share something with the community!
                  </p>
                </div>
              )}

              {posts.length === 0 && !isMember && (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <Lock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    Join to see posts
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Join this community to see and share posts.
                  </p>
                  <button
                    onClick={handleJoinCommunity}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Join Community
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                About
              </h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {community.description || "No description provided."}
              </p>
            </div>

            {/* Community Details */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
            {(isOwner || isAdmin) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
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
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
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
                View Full List →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {members.map((member) => (
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
          </div>
        )}

        {/* Marketplace Tab */}
        {activeTab === "marketplace" && (
          <div className="space-y-6">
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Marketplace</h2>
                <p className="text-sm text-gray-500">Buy and sell items or services</p>
              </div>
              {isMember && (
                <button
                  onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace/sell`)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Sell
                </button>
              )}
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Package className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">{marketplaceStats.totalProducts}</p>
                <p className="text-xs text-gray-500">Listings</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <TrendingUp className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">{marketplaceStats.totalSales}</p>
                <p className="text-xs text-gray-500">Sold</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <DollarSign className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-gray-900">${marketplaceStats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products or services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
                </button>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 px-3 transition ${viewMode === "grid" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 px-3 transition ${viewMode === "list" ? "bg-purple-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showFilters && categories.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {productsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                <p className="text-gray-500">
                  {isMember ? "Be the first to list an item or service!" : "Join the community to buy and sell."}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace/${product.id}`)}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    <div className="relative h-40 bg-gray-100">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium bg-white/90">
                        {getTypeIcon(product.type)}
                        <span className="ml-1">{product.type === "SERVICE" ? "Service" : product.type === "DIGITAL" ? "Digital" : "Physical"}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      {product.category && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                          {product.category}
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 mt-2 mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description || "No description"}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                        {product.salesCount > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <TrendingUp className="h-4 w-4" />
                            {product.salesCount} sold
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-medium">{product.seller.name?.[0] || "S"}</span>
                          </div>
                          <span>{product.seller.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace/${product.id}`)}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-300 cursor-pointer flex gap-4"
                  >
                    <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100">
                              {product.type === "SERVICE" ? "Service" : product.type === "DIGITAL" ? "Digital" : "Physical"}
                            </span>
                            {product.category && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {product.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-1 mt-2">{product.description || "No description"}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-[10px] font-medium">{product.seller.name?.[0] || "S"}</span>
                          </div>
                          <span>{product.seller.name}</span>
                        </div>
                        {product.salesCount > 0 && <span>{product.salesCount} sold</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Tab */}
        {activeTab === "live" && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Video className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Live Streaming Coming Soon
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Watch live streams and interact with members in real-time. Stay
              tuned!
            </p>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Community Events</h2>
                <p className="text-sm text-gray-500">Join events and connect with other members</p>
              </div>
              {isModerator && (
                <Link
                  href={`/portal/${houseSlug}/communities/${communitySlug}/events/create`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Create Event
                </Link>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex gap-2">
                {["upcoming", "past", "all"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setEventFilter(filter as any)}
                    className={`px-4 py-2 rounded-lg capitalize transition ${
                      eventFilter === filter
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Events List */}
            {eventsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : events.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500">
                  {isModerator
                    ? "Be the first to create an event in this community!"
                    : "Check back later for upcoming events."}
                </p>
                {isModerator && (
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
                {events.map((event) => {
                  const status = getEventStatusBadge(event);
                  const startDate = new Date(event.startAt);
                  const isAttending = event.userRSVP?.status === "CONFIRMED";
                  
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
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition">
                              {event.title}
                            </h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                              {status.text}
                            </span>
                            {isAttending && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Attending
                              </span>
                            )}
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

                        {/* Chevron */}
                        <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 self-center" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}