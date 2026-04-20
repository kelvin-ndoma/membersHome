// app/portal/[houseSlug]/communities/[communitySlug]/marketplace/[productId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Share2,
  Truck,
  Download,
  Shield,
  Clock,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Minus,
  Plus,
  CreditCard,
  DollarSign,
  Package,
  MessageCircle,
  X,
} from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
  seller: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
  hasPurchased: boolean;
  createdAt: string;
  feeBreakdown?: {
    houseFeePercent: number;
    platformFeePercent: number;
    houseFeeAmount: number;
    platformFeeAmount: number;
    sellerPayoutAmount: number;
  };
}

interface Community {
  id: string;
  name: string;
  memberStatus?: string;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const houseSlug = params.houseSlug as string;
  const communitySlug = params.communitySlug as string;
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [stripeConfigError, setStripeConfigError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductAndCommunity();
  }, [productId]);

  const fetchProductAndCommunity = async () => {
    try {
      const [productRes, communityRes] = await Promise.all([
        fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/products/${productId}`),
        fetch(`/api/portal/${houseSlug}/communities/${communitySlug}`),
      ]);

      const productData = await productRes.json();
      const communityData = await communityRes.json();

      if (productData.success) {
        setProduct(productData.product);
      }
      if (communityData.success) {
        setCommunity(communityData.community);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      setLoading(false);
    }
  };

  const initiatePurchase = async () => {
    if (!product) return;
    
    setProcessingPayment(true);
    setStripeConfigError(null);
    
    try {
      const response = await fetch(`/api/portal/${houseSlug}/communities/${communitySlug}/products/${productId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          shippingAddress: product.requiresShipping ? shippingAddress : null,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate purchase");
      }
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPurchaseId(data.purchaseId);
      } else {
        throw new Error("No payment intent created");
      }
    } catch (error) {
      console.error("Failed to initiate purchase:", error);
      setStripeConfigError(error instanceof Error ? error.message : "Payment configuration error");
      alert(error instanceof Error ? error.message : "Failed to initiate purchase. Please try again.");
      setShowPurchaseModal(false);
    } finally {
      setProcessingPayment(false);
    }
  };

  const getTypeIcon = () => {
    if (!product) return null;
    switch (product.type) {
      case "SERVICE": return <MessageCircle className="h-5 w-5" />;
      case "DIGITAL": return <Download className="h-5 w-5" />;
      case "DONATION": return <Heart className="h-5 w-5" />;
      default: return <Package className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    if (!product) return "";
    switch (product.type) {
      case "SERVICE": return "Service";
      case "DIGITAL": return "Digital Download";
      case "DONATION": return "Donation";
      default: return "Physical Item";
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
        <p className="text-gray-600">The product you're looking for doesn't exist</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-purple-600 hover:text-purple-700"
        >
          Go Back →
        </button>
      </div>
    );
  }

  const isMember = community?.memberStatus === "ACTIVE";
  const canPurchase = isMember && !product.hasPurchased;
  const discount = product.compareAtPrice 
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const totalAmount = product.price * quantity;
  const houseFee = product.feeBreakdown?.houseFeeAmount || (totalAmount * 0.05);

  if (purchaseSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. You will receive a confirmation email shortly.
          </p>
          {downloadUrl && (
            <div className="mb-6">
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Download className="h-4 w-4" />
                Download Now
              </a>
            </div>
          )}
          <button
            onClick={() => router.push(`/portal/${houseSlug}/communities/${communitySlug}/marketplace`)}
            className="text-purple-600 hover:text-purple-700"
          >
            Continue Shopping →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
            {product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingBag className="h-24 w-24 text-gray-300" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    selectedImage === index ? "border-purple-600" : "border-gray-200"
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Type Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {/* Seller Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {product.seller.image ? (
                <img src={product.seller.image} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-sm font-medium">
                  {product.seller.name?.[0] || "S"}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Sold by</p>
              <p className="font-medium text-gray-900">{product.seller.name}</p>
            </div>
          </div>

          {/* Price */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="text-lg text-gray-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-sm text-red-600 font-medium">
                  Save {discount}%
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              + ${houseFee.toFixed(2)} house fee ({(product.feeBreakdown?.houseFeePercent || 5)}%)
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Product Details */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="font-semibold text-gray-900 mb-3">Details</h2>
            <div className="space-y-2 text-sm">
              {product.category && (
                <div className="flex items-center gap-2 text-gray-600">
                  <TagIcon className="h-4 w-4" />
                  <span>Category: {product.category}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                {product.isDigital ? (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Instant digital download</span>
                  </>
                ) : product.requiresShipping ? (
                  <>
                    <Truck className="h-4 w-4" />
                    <span>Physical item - ships to your address</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4" />
                    <span>Local pickup available</span>
                  </>
                )}
              </div>
              {product.inventory !== null && product.inventory > 0 && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="h-4 w-4" />
                  <span>{product.inventory} items in stock</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Secure payment with Stripe</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Listed on {new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Purchase Button */}
          {!canPurchase && product.hasPurchased && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">You have already purchased this item</p>
              {product.isDigital && (
                <button className="mt-2 text-sm text-green-700 hover:text-green-800">
                  Download Again →
                </button>
              )}
            </div>
          )}

          {!canPurchase && !product.hasPurchased && !isMember && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
              <p className="text-yellow-800 font-medium">Join the community to purchase</p>
              <Link
                href={`/portal/${houseSlug}/communities/${communitySlug}`}
                className="mt-2 inline-block text-sm text-yellow-700 hover:text-yellow-800"
              >
                Go to Community →
              </Link>
            </div>
          )}

          {canPurchase && (
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
            >
              Buy Now
            </button>
          )}
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPurchaseModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl z-50 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Complete Purchase</h2>
              <button onClick={() => setShowPurchaseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{product.name} x{quantity}</span>
                    <span className="font-medium">${(product.price * quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">House fee ({(product.feeBreakdown?.houseFeePercent || 5)}%)</span>
                    <span className="text-red-600">+${houseFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              {!product.isDigital && product.inventory !== null && product.inventory > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.inventory || 999, quantity + 1))}
                      className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {product.requiresShipping && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Shipping Address</h3>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={shippingAddress.fullName}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={shippingAddress.addressLine1}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={shippingAddress.addressLine2}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Proceed to Payment Button */}
              {!clientSecret ? (
                <button
                  onClick={initiatePurchase}
                  disabled={processingPayment || (product.requiresShipping && !shippingAddress.fullName)}
                  className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Proceed to Payment - $${totalAmount.toFixed(2)}`
                  )}
                </button>
              ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm 
                    onSuccess={() => {
                      setPurchaseSuccess(true);
                      setShowPurchaseModal(false);
                    }}
                    purchaseId={purchaseId}
                    isDigital={product.isDigital}
                    productName={product.name}
                  />
                </Elements>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Payment Form Component
function PaymentForm({ onSuccess, purchaseId, isDigital, productName }: { 
  onSuccess: () => void; 
  purchaseId: string | null;
  isDigital: boolean;
  productName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded, update the purchase status via API
      try {
        await fetch(`/api/purchases/${purchaseId}/confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });
      } catch (err) {
        console.error('Failed to confirm purchase:', err);
      }
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4">
        <PaymentElement />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
              Processing...
            </>
          ) : (
            "Pay Now"
          )}
        </button>
      </div>
    </form>
  );
}

// Tag Icon Component
function TagIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2H2v10l9.17 9.17a2 2 0 0 0 2.83 0l7-7a2 2 0 0 0 0-2.83L12 2z" />
      <path d="M7 7h.01" />
    </svg>
  );
}