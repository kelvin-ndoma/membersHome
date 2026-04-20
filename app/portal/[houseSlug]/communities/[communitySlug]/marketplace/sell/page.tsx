// app/portal/[houseSlug]/communities/[communitySlug]/marketplace/sell/page.tsx
"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Package,
  Download,
  MessageCircle,
  Heart,
  DollarSign,
  Tag,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

type ProductType = "PHYSICAL" | "DIGITAL" | "SERVICE" | "DONATION";

export default function SellItemPage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;

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
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", `marketplace/${communitySlug}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await response.json();
        if (data.url) {
          setImages(prev => [...prev, data.url]);
        }
      }
    } catch (error) {
      console.error("Failed to upload images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
    if (formData.type === "PHYSICAL" && !formData.requiresShipping && !formData.isDigital) {
      newErrors.shipping = "Physical items require shipping or mark as digital";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          type: formData.type,
          category: formData.category || null,
          images: images,
          inventory: formData.inventory ? parseInt(formData.inventory) : null,
          isDigital: formData.type === "DIGITAL" || formData.isDigital,
          requiresShipping: formData.type === "PHYSICAL" && formData.requiresShipping && !formData.isDigital,
        }),
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace`);
      } else {
        alert(data.error || "Failed to list item");
      }
    } catch (error) {
      console.error("Failed to create listing:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
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

  const getTypeTitle = () => {
    switch (formData.type) {
      case "SERVICE": return "List a Service";
      case "DIGITAL": return "List a Digital Product";
      case "DONATION": return "Create a Donation Campaign";
      default: return "List a Physical Item";
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
          Back to Marketplace
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{getTypeTitle()}</h1>
        <p className="text-gray-600 mt-1">
          Share your {formData.type === "SERVICE" ? "service" : formData.type === "DIGITAL" ? "digital product" : "item"} with the community
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Type Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            What are you listing?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "PHYSICAL", label: "Physical Item", icon: Package, color: "green" },
              { value: "DIGITAL", label: "Digital Product", icon: Download, color: "purple" },
              { value: "SERVICE", label: "Service", icon: MessageCircle, color: "blue" },
              { value: "DONATION", label: "Donation", icon: Heart, color: "pink" },
            ].map((type) => {
              const Icon = type.icon;
              const isSelected = formData.type === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value as ProductType })}
                  className={`p-4 rounded-xl border-2 transition text-center ${
                    isSelected
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? `text-${type.color}-600` : "text-gray-400"}`} />
                  <p className={`text-sm font-medium ${isSelected ? `text-${type.color}-700` : "text-gray-700"}`}>
                    {type.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {getTypeIcon()}
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={formData.type === "SERVICE" ? "e.g., Web Design Consultation" : "e.g., Vintage Camera"}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder={formData.type === "SERVICE" 
                  ? "Describe your service, what you offer, pricing details, etc." 
                  : "Describe your item, condition, features, etc."}
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
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 ${
                    errors.price ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
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
                  placeholder="Original price"
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
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Images
          </h2>

          <div className="flex gap-3 flex-wrap">
            {images.map((url, index) => (
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
              {uploading ? (
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
                ref={fileInputRef}
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

        {/* Shipping/Delivery Options (for physical items) */}
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
            {errors.shipping && <p className="text-red-500 text-xs mt-2">{errors.shipping}</p>}
          </div>
        )}

        {/* Commission Notice */}
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900">Commission Notice</p>
              <p className="text-sm text-purple-700 mt-1">
                The house takes a 5% commission on each sale. You'll receive 95% of the sale price after the transaction is complete.
                {formData.type === "DONATION" && " Donations are processed as regular sales with the same commission structure."}
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Listing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                List Item
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}