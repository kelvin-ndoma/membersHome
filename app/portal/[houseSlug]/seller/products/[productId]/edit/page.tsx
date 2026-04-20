// app/portal/[houseSlug]/seller/products/[productId]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Loader2,
  Package,
  Download,
  MessageCircle,
  Heart,
} from "lucide-react";

type ProductType = "PHYSICAL" | "DIGITAL" | "SERVICE" | "DONATION";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  type: ProductType;
  category: string | null;
  images: string[];
  inventory: number | null;
  isDigital: boolean;
  requiresShipping: boolean;
  isPublished: boolean;
  communityId: string;
  communityName: string;
  communitySlug: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const productId = params.productId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    type: "PHYSICAL" as ProductType,
    category: "",
    inventory: "",
    isDigital: false,
    requiresShipping: true,
    isPublished: true,
    images: [] as string[],
  });

  useEffect(() => {
    fetchProduct();
  }, [productId, houseSlug]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/portal/${houseSlug}/seller/products/${productId}`);
      const data = await response.json();
      
      if (data.success) {
        const p = data.product;
        setProduct(p);
        setFormData({
          name: p.name,
          description: p.description || "",
          price: p.price.toString(),
          compareAtPrice: p.compareAtPrice?.toString() || "",
          type: p.type,
          category: p.category || "",
          inventory: p.inventory?.toString() || "",
          isDigital: p.isDigital,
          requiresShipping: p.requiresShipping,
          isPublished: p.isPublished,
          images: p.images || [],
        });
      } else {
        alert(data.error || "Failed to load product");
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
      alert("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", `marketplace/${product?.communitySlug}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.url) {
          uploadedUrls.push(data.url);
        }
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      console.error("Failed to upload images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${product?.communitySlug}/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          type: formData.type,
          category: formData.category || null,
          images: formData.images,
          inventory: formData.inventory ? parseInt(formData.inventory) : null,
          isDigital: formData.isDigital,
          requiresShipping: formData.requiresShipping,
          isPublished: formData.isPublished,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Product updated successfully!");
        router.push(`/portal/${houseSlug}/seller/products`);
      } else {
        alert(data.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = () => {
    switch (formData.type) {
      case "SERVICE": return <MessageCircle className="h-5 w-5" />;
      case "DIGITAL": return <Download className="h-5 w-5" />;
      case "DONATION": return <Heart className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
        <button
          onClick={() => router.push(`/portal/${houseSlug}/seller/products`)}
          className="text-purple-600 hover:text-purple-700"
        >
          Back to My Listings →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/portal/${houseSlug}/seller/products`)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Listings
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="text-gray-600 mt-1">Update your product information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {getTypeIcon()}
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compare at Price (Optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Electronics, Art, Consulting"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory (Optional)
                </label>
                <input
                  type="number"
                  value={formData.inventory}
                  onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="PHYSICAL">Physical Item</option>
                <option value="DIGITAL">Digital Download</option>
                <option value="SERVICE">Service</option>
                <option value="DONATION">Donation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Images</h2>

          <div className="flex gap-3 flex-wrap">
            {formData.images.map((url, index) => (
              <div key={index} className="relative w-24 h-24">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 transition">
              {uploadingImages ? (
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleImageUpload(e.target.files);
                  }
                }}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Upload up to 5 images. First image will be the cover.
          </p>
        </div>

        {/* Shipping/Delivery Options */}
        {formData.type === "PHYSICAL" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping & Delivery</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.requiresShipping}
                  onChange={(e) => setFormData({ ...formData, requiresShipping: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">This item requires shipping</span>
                  <p className="text-xs text-gray-500">Buyer will need to provide shipping address</p>
                </div>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isDigital}
                  onChange={(e) => setFormData({ ...formData, isDigital: e.target.checked })}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">This is a digital/printable item</span>
                  <p className="text-xs text-gray-500">Buyer can download immediately after purchase</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Listing Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listing Status</h2>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
              className="rounded"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Published</span>
              <p className="text-xs text-gray-500">Make this product visible to buyers</p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push(`/portal/${houseSlug}/seller/products`)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}