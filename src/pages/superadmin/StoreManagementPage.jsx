import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Tag,
  Percent,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  Layers,
  ArrowUpDown,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Zap,
  Check,
  Copy,
  AlertCircle
} from "lucide-react";
import { superAdminService } from "../../services/superAdminService";
import { useNotifications } from "../../context/NotificationContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { TableSkeleton } from "../../components/common/LoadingSkeleton";
import { cn } from "../../utils/cn";

export function StoreManagementPage() {
  const { showSuccess, showError } = useNotifications();

  // Active Tab: 'items' | 'coupons' | 'analytics'
  const [activeTab, setActiveTab] = useState("items");

  // Items State
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemCategoryFilter, setItemCategoryFilter] = useState("ALL");
  const [itemSearch, setItemSearch] = useState("");

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const [couponSearch, setCouponSearch] = useState("");

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Modals State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Copied state helper
  const [copiedCode, setCopiedCode] = useState(null);

  // Initial Item Form State
  const initialItemForm = {
    slug: "",
    title: "",
    tagline: "",
    category: "PLAN",
    interval: "MONTHLY",
    priceInr: 99,
    originalPriceInr: 199,
    currency: "INR",
    badge: "",
    isPublished: true,
    isPopular: false,
    featuresText: "Full Access to Practice MCQs\nDaily Placement Assessments\nWeekly Contests Access",
    mcqQuota: 100,
    codingQuota: 250,
    mockMinutes: 60,
    mentorshipSessions: 1,
    normalContestsIncluded: true,
    premiumContestsIncluded: false,
    validUntil: ""
  };

  const [itemForm, setItemForm] = useState(initialItemForm);

  // Initial Coupon Form State
  const initialCouponForm = {
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscountInr: 100,
    minOrderValueInr: 99,
    maxUsesTotal: 500,
    maxUsesPerUser: 1,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isActive: true
  };

  const [couponForm, setCouponForm] = useState(initialCouponForm);

  // Fetch Store Items
  const loadStoreItems = async () => {
    try {
      setItemsLoading(true);
      const res = await superAdminService.getStoreItems({
        category: itemCategoryFilter
      });
      const list = res?.data || res?.items || (Array.isArray(res) ? res : []);
      setItems(list);
    } catch (err) {
      showError(err.message || "Failed to load store items");
    } finally {
      setItemsLoading(false);
    }
  };

  // Fetch Coupons
  const loadCoupons = async () => {
    try {
      setCouponsLoading(true);
      const res = await superAdminService.getCoupons();
      const list = res?.data || res?.coupons || (Array.isArray(res) ? res : []);
      setCoupons(list);
    } catch (err) {
      showError(err.message || "Failed to load coupons");
    } finally {
      setCouponsLoading(false);
    }
  };

  // Fetch Analytics
  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const res = await superAdminService.getStoreAnalytics();
      const data = res?.data || res?.analytics || res;
      if (data) {
        setAnalytics(data);
      }
    } catch (err) {
      showError(err.message || "Failed to load store analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Initial load - populate both store catalog and coupons so metric pulse displays immediately
  useEffect(() => {
    loadStoreItems();
    loadCoupons();
    loadAnalytics();
  }, [itemCategoryFilter]);

  useEffect(() => {
    if (activeTab === "coupons") {
      loadCoupons();
    } else if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [activeTab]);

  // Open Create Item Modal
  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemForm(initialItemForm);
    setIsItemModalOpen(true);
  };

  // Open Edit Item Modal
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      slug: item.slug || "",
      title: item.title || "",
      tagline: item.tagline || "",
      category: item.category || "PLAN",
      interval: item.interval || "MONTHLY",
      priceInr: item.priceInr ?? 0,
      originalPriceInr: item.originalPriceInr ?? item.priceInr ?? 0,
      currency: item.currency || "INR",
      badge: item.badge || "",
      isPublished: Boolean(item.isPublished),
      isPopular: Boolean(item.isPopular),
      featuresText: Array.isArray(item.features) ? item.features.join("\n") : "",
      mcqQuota: item.quotas?.mcqPerSubjectLimit ?? 100,
      codingQuota: item.quotas?.codingQuestionLimit ?? 250,
      mockMinutes: item.quotas?.mockInterviewMinutes ?? 60,
      mentorshipSessions: item.quotas?.mentorshipSessions ?? 1,
      normalContestsIncluded: Boolean(item.quotas?.normalContestsIncluded),
      premiumContestsIncluded: Boolean(item.quotas?.premiumContestsIncluded),
      validUntil: item.validUntil ? new Date(item.validUntil).toISOString().slice(0, 10) : ""
    });
    setIsItemModalOpen(true);
  };

  // Submit Item (Create or Update)
  const handleSubmitItem = async (e) => {
    e.preventDefault();
    if (!itemForm.slug || !itemForm.title) {
      showError("Plan code/slug and title are required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        slug: itemForm.slug.trim().toLowerCase().replace(/\s+/g, "_"),
        title: itemForm.title.trim(),
        tagline: itemForm.tagline.trim(),
        category: itemForm.category,
        interval: itemForm.interval,
        priceInr: Number(itemForm.priceInr),
        originalPriceInr: Number(itemForm.originalPriceInr || itemForm.priceInr),
        currency: itemForm.currency || "INR",
        badge: itemForm.badge.trim(),
        isPublished: Boolean(itemForm.isPublished),
        isPopular: Boolean(itemForm.isPopular),
        features: itemForm.featuresText
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        quotas: {
          mcqPerSubjectLimit: Number(itemForm.mcqQuota),
          codingQuestionLimit: Number(itemForm.codingQuota),
          mockInterviewMinutes: Number(itemForm.mockMinutes),
          mentorshipSessions: Number(itemForm.mentorshipSessions),
          normalContestsIncluded: Boolean(itemForm.normalContestsIncluded),
          premiumContestsIncluded: Boolean(itemForm.premiumContestsIncluded)
        },
        validUntil: itemForm.validUntil ? new Date(itemForm.validUntil) : null
      };

      if (editingItem) {
        const targetId = editingItem._id || editingItem.id || editingItem.slug || editingItem.itemId;
        await superAdminService.updateStoreItem(targetId, payload);
        showSuccess(`Plan "${payload.title}" updated successfully`);
      } else {
        await superAdminService.createStoreItem(payload);
        showSuccess(`Plan "${payload.title}" created successfully`);
      }

      setIsItemModalOpen(false);
      loadStoreItems();
    } catch (err) {
      showError(err.message || "Failed to save store item");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Item Publish Status
  const handleToggleItemPublish = async (item) => {
    try {
      const res = await superAdminService.toggleStoreItemPublish(item._id || item.id);
      showSuccess(res.message || "Store item publish status updated");
      loadStoreItems();
    } catch (err) {
      showError(err.message || "Failed to toggle status");
    }
  };

  // Delete Item
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    try {
      await superAdminService.deleteStoreItem(item._id || item.id);
      showSuccess(`"${item.title}" removed from catalog`);
      loadStoreItems();
    } catch (err) {
      showError(err.message || "Failed to delete item");
    }
  };

  // Create Coupon
  const handleSubmitCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code) {
      showError("Coupon code is required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        description: couponForm.description.trim(),
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue),
        maxDiscountInr: Number(couponForm.maxDiscountInr) || null,
        minOrderValueInr: Number(couponForm.minOrderValueInr) || 0,
        maxUsesTotal: Number(couponForm.maxUsesTotal) || 1000,
        maxUsesPerUser: Number(couponForm.maxUsesPerUser) || 1,
        validFrom: new Date(couponForm.validFrom),
        validUntil: new Date(couponForm.validUntil),
        isActive: Boolean(couponForm.isActive)
      };

      await superAdminService.createCoupon(payload);
      showSuccess(`Coupon "${payload.code}" generated successfully`);
      setIsCouponModalOpen(false);
      setCouponForm(initialCouponForm);
      loadCoupons();
    } catch (err) {
      showError(err.message || "Failed to generate coupon");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Coupon Active Status
  const handleToggleCouponActive = async (coupon) => {
    try {
      const res = await superAdminService.toggleCouponActive(coupon.code);
      showSuccess(res.message || "Coupon status toggled");
      loadCoupons();
    } catch (err) {
      showError(err.message || "Failed to toggle coupon");
    }
  };

  // Delete Coupon
  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    try {
      await superAdminService.deleteCoupon(coupon.code);
      showSuccess(`Coupon "${coupon.code}" deleted`);
      loadCoupons();
    } catch (err) {
      showError(err.message || "Failed to delete coupon");
    }
  };

  // Copy helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !itemSearch ||
        item.title?.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.slug?.toLowerCase().includes(itemSearch.toLowerCase()) ||
        item.tagline?.toLowerCase().includes(itemSearch.toLowerCase());
      return matchesSearch;
    });
  }, [items, itemSearch]);

  // Filtered Coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch =
        !couponSearch ||
        coupon.code?.toLowerCase().includes(couponSearch.toLowerCase()) ||
        coupon.description?.toLowerCase().includes(couponSearch.toLowerCase());
      return matchesSearch;
    });
  }, [coupons, couponSearch]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Flash Store & Commerce Engine
              </h1>
              <p className="text-sm text-slate-500">
                Manage dynamic subscription tiers, festive offers, modular passes, and promo coupon codes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "items" && (
            <Button
              onClick={handleOpenCreateItem}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Plan or Offer
            </Button>
          )}

          {activeTab === "coupons" && (
            <Button
              onClick={() => setIsCouponModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-2"
            >
              <Tag className="w-4 h-4" />
              Generate Coupon
            </Button>
          )}
        </div>
      </div>

      {/* Metric Pulse Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Published Catalog
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {items.filter((i) => i.isPublished).length}
            </span>
            <span className="text-xs text-slate-500">of {items.length} total offers</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Coupons
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {coupons.filter((c) => c.isActive).length}
            </span>
            <span className="text-xs text-slate-500">running campaigns</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Coupon Redemptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {coupons.reduce((acc, c) => acc + (c.currentUsesTotal || 0), 0)}
            </span>
            <span className="text-xs text-slate-500">total checkout uses</span>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Modular Passes
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {items.filter((i) => i.category === "MODULAR_PASS" || i.category === "COMPANY_PACK").length}
            </span>
            <span className="text-xs text-slate-500">passes configured</span>
          </div>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab("items")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "items"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <ShoppingBag className="w-4 h-4" />
          Plans & Passes Catalog ({items.length})
        </button>

        <button
          onClick={() => setActiveTab("coupons")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "coupons"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Tag className="w-4 h-4" />
          Promotional Coupons ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={cn(
            "pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2",
            activeTab === "analytics"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Store Pulse
        </button>
      </div>

      {/* TAB 1: PLANS & PASSES CATALOG */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search plans by title, slug, or keywords..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Category:
              </span>
              {["ALL", "PLAN", "MODULAR_PASS", "COMPANY_PACK", "MINUTES_PACK", "SERIES"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setItemCategoryFilter(cat)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer shrink-0",
                    itemCategoryFilter === cat
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {cat.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          {itemsLoading ? (
            <TableSkeleton rows={4} />
          ) : filteredItems.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Store Items Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Create new subscription plans, festive sprint deals, or modular passes to populate the student store.
              </p>
              <Button
                onClick={handleOpenCreateItem}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create First Item
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card
                  key={item._id || item.id || item.slug}
                  className={cn(
                    "relative flex flex-col justify-between p-5 border transition-all duration-150 hover:shadow-md",
                    item.isPublished
                      ? "border-slate-200/90 bg-white"
                      : "border-slate-200/60 bg-slate-50/70 opacity-80"
                  )}
                >
                  {/* Top Bar with Badges and Toggle */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase",
                            item.category === "PLAN"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : item.category === "COMPANY_PACK"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : item.category === "MINUTES_PACK"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          )}
                        >
                          {item.category.replace("_", " ")}
                        </span>

                        {item.badge && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.badge}
                          </span>
                        )}

                        {item.interval && (
                          <span className="text-[10px] font-medium text-slate-400">
                            {item.category === "PLAN" ? "MONTHLY" : item.interval}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleItemPublish(item)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          item.isPublished ? "bg-emerald-500" : "bg-slate-300"
                        )}
                        title={item.isPublished ? "Click to unpublish (hide from students)" : "Click to publish"}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                            item.isPublished ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>

                    {/* Title and Tagline */}
                    <div className="mb-3">
                      <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                        <span>{item.title}</span>
                      </h3>
                      <div className="font-mono text-[11px] text-slate-400">
                        code: {item.slug}
                      </div>
                      {item.tagline && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {item.tagline}
                        </p>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-2 py-2 border-y border-slate-100 my-2">
                      <span className="text-xl font-extrabold text-slate-900">
                        ₹{item.priceInr}
                      </span>
                      {item.originalPriceInr && item.originalPriceInr > item.priceInr && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{item.originalPriceInr}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-500 font-medium">
                        / {item.category === "PLAN" ? "monthly" : (item.interval ? item.interval.toLowerCase().replace('_', ' ') : "one-time")}
                      </span>
                      {item.category === "PLAN" && item.pricing?.yearly && (
                        <span className="text-[10px] text-slate-400 font-normal ml-auto">
                          (₹{item.pricing.yearly}/yr)
                        </span>
                      )}
                    </div>

                    {/* Quotas Breakdown */}
                    {item.quotas && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100 my-2.5">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            MCQ Quota
                          </span>
                          <span className="font-bold text-slate-800">
                            {item.quotas.mcqPerSubjectLimit ?? "Unlimited"} / subj
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Coding Qs
                          </span>
                          <span className="font-bold text-slate-800">
                            {item.quotas.codingQuestionLimit ?? "Unlimited"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            AI Mock
                          </span>
                          <span className="font-bold text-slate-800">
                            {item.quotas.mockInterviewMinutes ?? 0} mins
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Contests
                          </span>
                          <span className="font-bold text-slate-800">
                            {item.quotas.normalContestsIncluded ? "Included" : "Paid"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Features List */}
                    {Array.isArray(item.features) && item.features.length > 0 && (
                      <ul className="space-y-1 text-xs text-slate-600 mt-2 mb-4">
                        {item.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </li>
                        ))}
                        {item.features.length > 3 && (
                          <li className="text-[11px] text-slate-400 italic">
                            +{item.features.length - 3} more benefits
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase tracking-wider",
                        item.isPublished ? "text-emerald-600" : "text-amber-600"
                      )}
                    >
                      {item.isPublished ? "Active on Store" : "Hidden / Draft"}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditItem(item)}
                        className="h-7 px-2 text-xs text-slate-600 hover:text-slate-900"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item)}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PROMOTIONAL COUPONS */}
      {activeTab === "coupons" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search coupons by code or campaign..."
                value={couponSearch}
                onChange={(e) => setCouponSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <Button
              onClick={() => setIsCouponModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Coupon Code
            </Button>
          </div>

          {/* Coupons Table */}
          {couponsLoading ? (
            <TableSkeleton rows={5} />
          ) : filteredCoupons.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-slate-300">
              <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No Active Coupons</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Generate promotional discount codes (e.g. FLASH50, FESTIVE100) to incentivize student signups.
              </p>
              <Button
                onClick={() => setIsCouponModalOpen(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Generate First Coupon
              </Button>
            </Card>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Coupon Code</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Min Order</th>
                      <th className="py-3 px-4">Usage / Cap</th>
                      <th className="py-3 px-4">Validity</th>
                      <th className="py-3 px-4 text-center">Kill Switch</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCoupons.map((coupon) => (
                      <tr key={coupon.code} className="hover:bg-slate-50/50 transition-colors">
                        {/* Code */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => copyToClipboard(coupon.code)}
                              className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copy code"
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          {coupon.description && (
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                              {coupon.description}
                            </div>
                          )}
                        </td>

                        {/* Discount */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {coupon.discountType === "PERCENTAGE"
                              ? `${coupon.discountValue}% OFF`
                              : `₹${coupon.discountValue} FLAT`}
                          </div>
                          {coupon.discountType === "PERCENTAGE" && coupon.maxDiscountInr && (
                            <div className="text-[10px] text-slate-500">
                              Capped at ₹{coupon.maxDiscountInr}
                            </div>
                          )}
                        </td>

                        {/* Min Order */}
                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          ₹{coupon.minOrderValueInr || 0}
                        </td>

                        {/* Usage Progress */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {coupon.currentUsesTotal || 0}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">
                              {coupon.maxUsesTotal || "Unlimited"}
                            </span>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((coupon.currentUsesTotal || 0) / (coupon.maxUsesTotal || 1)) * 100
                                )}%`
                              }}
                            />
                          </div>
                        </td>

                        {/* Validity */}
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>
                            {coupon.validUntil
                              ? `Until ${new Date(coupon.validUntil).toLocaleDateString()}`
                              : "No expiry"}
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleCouponActive(coupon)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              coupon.isActive ? "bg-emerald-500" : "bg-slate-300"
                            )}
                            title={coupon.isActive ? "Click to deactivate coupon instantly" : "Click to activate coupon"}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                                coupon.isActive ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </td>

                        {/* Delete */}
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCoupon(coupon)}
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STORE PULSE ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <Card className="p-6 border-slate-200/80 bg-white">
            <h3 className="text-base font-bold text-slate-900 mb-2">Commerce Architecture Overview</h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mb-6">
              The Flash Commerce Engine supports both modular, itemized passes (FanCode pattern) and recurring AutoPay subscriptions.
              Festive sprint offers created here automatically sync to all student portals with server-side validation.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <span className="text-xs font-semibold text-slate-500 uppercase">Dynamic Catalog Items</span>
                <div className="text-2xl font-bold text-slate-900 mt-2">{items.length}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {items.filter((i) => i.isPublished).length} currently active on student store
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <span className="text-xs font-semibold text-slate-500 uppercase">Coupon Redemptions</span>
                <div className="text-2xl font-bold text-slate-900 mt-2">
                  {coupons.reduce((acc, c) => acc + (c.currentUsesTotal || 0), 0)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Across {coupons.length} distinct promo codes
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <span className="text-xs font-semibold text-slate-500 uppercase">Razorpay Gateway Integration</span>
                <div className="text-base font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Live AutoPay & Direct Orders
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  All discounted totals validated server-side
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: CREATE / EDIT STORE ITEM */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? "Edit Store Offer" : "Create New Store Plan / Offer"}
        subtitle="Configure title, pricing, quota entitlements, and launch state"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitItem} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Diwali Placement Sprint 2026"
                value={itemForm.title}
                onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plan Slug / Code *
              </label>
              <input
                type="text"
                required
                disabled={Boolean(editingItem)}
                placeholder="e.g. diwali_sprint_2026"
                value={itemForm.slug}
                onChange={(e) => setItemForm({ ...itemForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tagline / Short Summary
            </label>
            <input
              type="text"
              placeholder="e.g. Intensive 30-day corporate interview bootcamp with full company bank access"
              value={itemForm.tagline}
              onChange={(e) => setItemForm({ ...itemForm, tagline: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="PLAN">Subscription Plan</option>
                <option value="MODULAR_PASS">Modular Subject Pass</option>
                <option value="COMPANY_PACK">Company Placement Pack</option>
                <option value="MINUTES_PACK">Mock Interview Pack</option>
                <option value="SERIES">Contest Series Pass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cadence / Duration
              </label>
              <select
                value={itemForm.interval}
                onChange={(e) => setItemForm({ ...itemForm, interval: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="ONE_TIME">One-Time Pass</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Badge Pill (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Festive Offer, Popular"
                value={itemForm.badge}
                onChange={(e) => setItemForm({ ...itemForm, badge: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹ INR) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={itemForm.priceInr}
                onChange={(e) => setItemForm({ ...itemForm, priceInr: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Original Price (₹ Strike-through)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 299"
                value={itemForm.originalPriceInr}
                onChange={(e) => setItemForm({ ...itemForm, originalPriceInr: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Offer Expiry (Optional)
              </label>
              <input
                type="date"
                value={itemForm.validUntil}
                onChange={(e) => setItemForm({ ...itemForm, validUntil: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quota Entitlements */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Student Entitlements & Quotas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  MCQ / Subject
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.mcqQuota}
                  onChange={(e) => setItemForm({ ...itemForm, mcqQuota: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Coding Qs
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.codingQuota}
                  onChange={(e) => setItemForm({ ...itemForm, codingQuota: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  AI Mock Mins
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.mockMinutes}
                  onChange={(e) => setItemForm({ ...itemForm, mockMinutes: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Mentorship Mins
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemForm.mentorshipSessions}
                  onChange={(e) => setItemForm({ ...itemForm, mentorshipSessions: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={itemForm.normalContestsIncluded}
                  onChange={(e) => setItemForm({ ...itemForm, normalContestsIncluded: e.target.checked })}
                  className="rounded text-blue-600"
                />
                Weekly Contests Included
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={itemForm.premiumContestsIncluded}
                  onChange={(e) => setItemForm({ ...itemForm, premiumContestsIncluded: e.target.checked })}
                  className="rounded text-blue-600"
                />
                Premium Contests Included
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Included Benefits (One per line)
            </label>
            <textarea
              rows={3}
              value={itemForm.featuresText}
              onChange={(e) => setItemForm({ ...itemForm, featuresText: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
              placeholder="e.g. Full Placement Pass&#10;500+ MCQs&#10;ATS Resume Builder"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={itemForm.isPublished}
                onChange={(e) => setItemForm({ ...itemForm, isPublished: e.target.checked })}
                className="rounded text-blue-600"
              />
              Publish immediately to student store
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsItemModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                {submitting ? "Saving..." : editingItem ? "Update Offer" : "Publish Offer"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: GENERATE COUPON */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Generate Promo Coupon Code"
        subtitle="Create discount vouchers with usage caps and expiry restrictions"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitCoupon} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FLASH50"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Discount Type
              </label>
              <select
                value={couponForm.discountType}
                onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT_AMOUNT">Flat Amount (₹ INR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {couponForm.discountType === "PERCENTAGE" ? "Discount Percentage (%)" : "Flat Discount (₹ INR)"} *
              </label>
              <input
                type="number"
                required
                min="1"
                max={couponForm.discountType === "PERCENTAGE" ? 100 : 10000}
                value={couponForm.discountValue}
                onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Discount Cap (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 150"
                value={couponForm.maxDiscountInr}
                onChange={(e) => setCouponForm({ ...couponForm, maxDiscountInr: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Min Order Value (₹ INR)
              </label>
              <input
                type="number"
                min="0"
                value={couponForm.minOrderValueInr}
                onChange={(e) => setCouponForm({ ...couponForm, minOrderValueInr: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Redemptions Cap
              </label>
              <input
                type="number"
                min="1"
                value={couponForm.maxUsesTotal}
                onChange={(e) => setCouponForm({ ...couponForm, maxUsesTotal: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valid From
              </label>
              <input
                type="date"
                value={couponForm.validFrom}
                onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={couponForm.validUntil}
                onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Campaign Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Diwali special campaign for engineering students"
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={couponForm.isActive}
                onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                className="rounded text-blue-600"
              />
              Activate immediately
            </label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                {submitting ? "Generating..." : "Generate Coupon"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default StoreManagementPage;

