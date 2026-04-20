// app/portal/[houseSlug]/communities/[communitySlug]/marketplace/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Star,
  Truck,
  Download,
  MessageCircle,
  Loader2,
  X,
  Package,
  Clock,
  CheckCircle,
  Sparkles,
  Grid3x3,
  List,
  ChevronDown,
  Zap,
  Heart,
  Eye,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  type: "PHYSICAL" | "DIGITAL" | "SERVICE" | "DONATION";
  category: string | null;
  images: string[];
  inventory: number | null;
  isDigital: boolean;
  requiresShipping: boolean;
  salesCount: number;
  revenue: number;
  seller: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  memberRole?: string;
  memberStatus?: string;
}

export default function CommunityMarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [houseFeePercent, setHouseFeePercent] = useState(5);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    fetchCommunityAndProducts();
  }, [communitySlug, selectedCategory, selectedType, sortBy]);

  const fetchCommunityAndProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedType !== "all") params.append("type", selectedType);
      if (sortBy === "price_asc") params.append("sort", "price_asc");
      if (sortBy === "price_desc") params.append("sort", "price_desc");
      
      const [communityRes, productsRes] = await Promise.all([
        fetch(`/api/portal/${houseSlug}/communities/${communitySlug}`),
        fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/products?${params}`),
      ]);

      const communityData = await communityRes.json();
      const productsData = await productsRes.json();

      if (communityData.success) {
        setCommunity(communityData.community);
      }

      if (productsData.success) {
        setProducts(productsData.products);
        setCategories(productsData.categories || []);
        setStats(productsData.stats || { totalProducts: 0, totalSales: 0, totalRevenue: 0 });
        setHouseFeePercent(productsData.houseFeePercent || 5);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "popular") return b.salesCount - a.salesCount;
    return 0;
  });

  const canSell = community?.memberStatus === "ACTIVE";

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "DIGITAL": return <Download className="h-4 w-4" />;
      case "SERVICE": return <MessageCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "PHYSICAL": return "Physical Item";
      case "DIGITAL": return "Digital Download";
      case "SERVICE": return "Service";
      case "DONATION": return "Donation";
      default: return type;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-600 mt-1">
            Buy and sell items or services within {community?.name}
          </p>
        </div>
        {canSell && (
          <button
            onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace/sell`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
          >
            <Plus className="h-5 w-5" />
            Sell an Item or Service
          </button>
        )}
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <Package className="h-4 w-4" />
            <span className="text-sm">Listings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Total Sales</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm">Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>

          {/* View Toggle */}
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

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-4">
            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
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

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="PHYSICAL">Physical Items</option>
                <option value="DIGITAL">Digital Downloads</option>
                <option value="SERVICE">Services</option>
                <option value="DONATION">Donations</option>
              </select>
            </div>

            {/* Commission Info */}
            <div className="ml-auto flex items-center text-sm text-gray-500">
              <Zap className="h-4 w-4 text-yellow-500 mr-1" />
              House takes {houseFeePercent}% commission
            </div>
          </div>
        )}
      </div>

      {/* Products Grid/List */}
      {sortedProducts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
          <p className="text-gray-500 mb-4">
            {canSell 
              ? "Be the first to list an item or service in this community!"
              : "Join the community to buy and sell items."}
          </p>
          {canSell && (
            <button
              onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace/sell`)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Plus className="h-5 w-5" />
              List an Item or Service
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              houseSlug={houseSlug}
              communitySlug={communitySlug}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProducts.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              houseSlug={houseSlug}
              communitySlug={communitySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Product Card Component (Grid View)
function ProductCard({ 
  product, 
  houseSlug, 
  communitySlug 
}: { 
  product: Product;
  houseSlug: string;
  communitySlug: string;
}) {
  const router = useRouter();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "SERVICE":
        return "bg-blue-100 text-blue-700";
      case "DIGITAL":
        return "bg-purple-100 text-purple-700";
      case "DONATION":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  return (
    <div 
      onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace/${product.id}`)}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
    >
      {/* Product Image */}
      <div className="relative h-48 bg-gray-100">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
            {discount}% OFF
          </div>
        )}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium ${getTypeStyles(product.type)}`}>
          {product.type === "SERVICE" ? "Service" : product.type === "DIGITAL" ? "Digital" : product.type === "DONATION" ? "Donation" : "Physical"}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {product.category && (
          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            {product.category}
          </span>
        )}
        
        <h3 className="font-semibold text-gray-900 mt-2 mb-1 line-clamp-1">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {product.description || "No description provided"}
        </p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compareAtPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          {product.salesCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              {product.salesCount} sold
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-medium">
                {product.seller.name?.[0] || "S"}
              </span>
            </div>
            <span>{product.seller.name}</span>
          </div>
          <span>•</span>
          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

// Product List Item Component (List View)
function ProductListItem({ 
  product, 
  houseSlug, 
  communitySlug 
}: { 
  product: Product;
  houseSlug: string;
  communitySlug: string;
}) {
  const router = useRouter();

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "SERVICE":
        return "bg-blue-100 text-blue-700";
      case "DIGITAL":
        return "bg-purple-100 text-purple-700";
      case "DONATION":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  return (
    <div 
      onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace/${product.id}`)}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all duration-300 cursor-pointer flex gap-4"
    >
      {/* Product Image */}
      <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {product.images[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeStyles(product.type)}`}>
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
            {product.compareAtPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                ${product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
          {product.description || "No description provided"}
        </p>

        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-medium">
                {product.seller.name?.[0] || "S"}
              </span>
            </div>
            <span>{product.seller.name}</span>
          </div>
          <span>•</span>
          <span>{new Date(product.createdAt).toLocaleDateString()}</span>
          {product.salesCount > 0 && (
            <>
              <span>•</span>
              <span>{product.salesCount} sold</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}