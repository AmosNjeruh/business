// Business Suite – Brands Management
// Route: /admin/brands
// Full CRUD: create vendors/brands, search, manage, launch campaigns on behalf

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import {
  getBrands, createBrand, updateBrand, deleteBrand, BrandData, getCategories
} from "@/services/vendor";
import {
  FaBuilding, FaPlus, FaChevronRight, FaBullhorn, FaUsers,
  FaSpinner, FaSearch, FaEdit, FaTrash, FaEllipsisH,
  FaTimes, FaSave, FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  niches: Array<{ id: string; name: string; slug: string }>;
}

interface Niche {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  industry?: string;
  niche?: string;
  activeCampaigns?: number;
  totalCampaigns?: number;
  partnersCount?: number;
  status?: string;
  createdAt?: string;
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase();
}

function BrandModal({
  brand,
  onClose,
  onSave,
  isSaving,
}: {
  brand: Partial<Brand> | null;
  onClose: () => void;
  onSave: (data: BrandData) => void;
  isSaving: boolean;
}) {
  const isEdit = !!brand?.id;
  const [name, setName] = useState(brand?.name || "");
  const [email, setEmail] = useState(brand?.email || "");
  const [phone, setPhone] = useState(brand?.phone || "");
  const [description, setDescription] = useState(brand?.description || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [otherNiche, setOtherNiche] = useState("");
  
  // Categories and niches from API
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableNiches, setAvailableNiches] = useState<Niche[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingNiches, setLoadingNiches] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const cats = await getCategories();
        setCategories(cats || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories. Please refresh the page.');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch niches when category is selected
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category && category.niches) {
        setAvailableNiches(category.niches.map(n => ({ id: n.id, name: n.name, slug: n.slug })));
        // Clear selected niches when category changes
        setSelectedNiches([]);
      } else {
        setAvailableNiches([]);
      }
    } else {
      setAvailableNiches([]);
      setSelectedNiches([]);
    }
  }, [selectedCategory, categories]);

  const toggleNiche = (nicheId: string) => {
    setSelectedNiches((prev) =>
      prev.includes(nicheId) ? prev.filter((n) => n !== nicheId) : [...prev, nicheId]
    );
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15 transition-all";
  const labelCls = "block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <FaTimes className="h-4 w-4" />
        </button>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-5">
          {isEdit ? "Edit Brand" : "Create New Brand"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const chosenNiches = [...selectedNiches];
            if (otherNiche.trim()) {
              chosenNiches.push(otherNiche.trim());
            }
            // Convert niche IDs to names for the API
            const nicheNames = chosenNiches
              .map(nicheId => {
                const niche = availableNiches.find(n => n.id === nicheId);
                return niche ? niche.name : nicheId;
              })
              .filter(Boolean);
            
            const categoryName = selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name || ""
              : "";
            
            // Send niches as array for proper database storage
            const nichesArray = nicheNames.length > 0 ? nicheNames : [];
            onSave({ 
              name, 
              email, 
              phone, 
              description, 
              industry: categoryName,
              niche: nichesArray.join(", ")
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className={labelCls}>Brand name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              placeholder="e.g. Northbridge Studio"
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="brand@example.com"
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="What does this brand do?"
              className={`${inputCls} resize-none`} />
          </div>
            <div>
            <label className={labelCls}>Category <span className="text-red-500">*</span></label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 py-2.5">
                <FaSpinner className="animate-spin h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Loading categories...</span>
              </div>
            ) : (
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            </div>

          {selectedCategory && (
            <div>
              <label className={labelCls}>Niches (select all that apply) <span className="text-red-500">*</span></label>
              {loadingNiches ? (
                <div className="flex items-center gap-2 py-2.5">
                  <FaSpinner className="animate-spin h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400">Loading niches...</span>
                </div>
              ) : availableNiches.length > 0 ? (
                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-2 bg-slate-50 dark:bg-white/5">
                  {availableNiches.map((niche) => (
                    <label
                      key={niche.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 p-2 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNiches.includes(niche.id)}
                        onChange={() => toggleNiche(niche.id)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{niche.name}</span>
                    </label>
                  ))}
            </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-2">No niches available for this category</p>
              )}
              <div className="mt-3">
                <input
                  type="text"
                  value={otherNiche}
                  onChange={(e) => setOtherNiche(e.target.value)}
                  placeholder="Or add a custom niche (optional)"
                  className={inputCls}
                />
          </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={
                isSaving || 
                !name.trim() || 
                !email.trim() || 
                !selectedCategory || 
                selectedNiches.length === 0 && !otherNiche.trim()
              }
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaSave className="h-3.5 w-3.5" />}
              {isSaving ? "Saving…" : (isEdit ? "Save Changes" : "Create Brand")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  brand,
  onClose,
  onConfirm,
  isDeleting,
}: {
  brand: Brand;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <FaExclamationTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Delete "{brand.name}"?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-all">
            {isDeleting ? <FaSpinner className="animate-spin h-3.5 w-3.5" /> : <FaTrash className="h-3.5 w-3.5" />}
            {isDeleting ? "Deleting…" : "Delete Brand"}
          </button>
        </div>
      </div>
    </div>
  );
}

const AdminBrandsPage: React.FC = () => {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getBrands();
      setBrands(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.response?.status === 401) { router.push("/admin/auth"); return; }
      // If endpoint not yet implemented, show empty state gracefully
      setBrands([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleSave = async (data: BrandData) => {
    setIsSaving(true);
    try {
      if (editingBrand?.id) {
        const updated = await updateBrand(editingBrand.id, data);
        setBrands((prev) => prev.map((b) => b.id === editingBrand.id ? { ...b, ...updated } : b));
        toast.success("Brand updated");
      } else {
        const newBrand = await createBrand(data);
        setBrands((prev) => [newBrand, ...prev]);
        toast.success("Brand created successfully");
      }
      setShowModal(false);
      setEditingBrand(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save brand");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBrand) return;
    setIsDeleting(true);
    try {
      await deleteBrand(deletingBrand.id);
      setBrands((prev) => prev.filter((b) => b.id !== deletingBrand.id));
      toast.success("Brand deleted");
      setDeletingBrand(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete brand");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = brands.filter((b) =>
    !search ||
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.industry?.toLowerCase().includes(search.toLowerCase()) ||
    b.niche?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Brands</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage multiple brands — create, edit, or run campaigns on their behalf</p>
          </div>
          <button
            onClick={() => { setEditingBrand(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all whitespace-nowrap">
            <FaPlus className="h-3.5 w-3.5" /> Add Brand
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brands by name, industry or niche…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-400 dark:focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/15" />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-3xl text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-16 text-center">
            <FaBuilding className="h-14 w-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-base font-semibold text-slate-900 dark:text-white mb-1">
              {search ? `No brands match "${search}"` : "No brands yet"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {search ? "Try a different search term" : "Create your first brand to start building campaigns"}
            </p>
            {!search && (
              <button onClick={() => { setEditingBrand(null); setShowModal(true); }}
                className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 font-semibold text-sm px-5 py-2.5 rounded-xl">
                Create Your First Brand
              </button>
            )}
          </div>
        ) : (
          <div className="bus-responsive-card-grid gap-5">
            {filtered.map((brand) => (
              <div
                key={brand.id}
                className="relative rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-5 hover:border-emerald-400 dark:hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group"
              >
                {/* Kebab menu */}
                <div className="absolute top-4 right-4">
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === brand.id ? null : brand.id); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <FaEllipsisH className="h-3.5 w-3.5" />
                  </button>
                  {openMenuId === brand.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                        <button onClick={() => { setEditingBrand(brand); setShowModal(true); setOpenMenuId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                          <FaEdit className="h-3 w-3" /> Edit Brand
                        </button>
                        <Link href={`/admin/campaigns/create?brandId=${brand.id}`}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                          <FaBullhorn className="h-3 w-3" /> New Campaign
                        </Link>
                        <button onClick={() => { setDeletingBrand(brand); setOpenMenuId(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                          <FaTrash className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 mb-4 pr-8">
                  <div className="h-12 w-12 rounded-xl flex-shrink-0 overflow-hidden border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-700 dark:text-white font-bold text-lg">
                    {getInitial(brand.name)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors truncate">
                      {brand.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {[brand.industry, brand.niche].filter(Boolean).join(" · ") || "No category"}
                    </p>
                  </div>
                </div>

                {brand.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{brand.description}</p>
                )}

                <div className="bus-responsive-stat-grid gap-2 mb-4">
                  <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/6 p-2 text-center">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{brand.activeCampaigns ?? 0}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-0.5 mt-0.5">
                      <FaBullhorn className="h-2 w-2" /> Active
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/6 p-2 text-center">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{brand.totalCampaigns ?? 0}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Total</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-white/3 border border-slate-200 dark:border-white/6 p-2 text-center">
                    <p className="text-base font-bold text-slate-900 dark:text-white">{brand.partnersCount ?? 0}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-0.5 mt-0.5">
                      <FaUsers className="h-2 w-2" /> Partners
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-white/8">
                  <Link href={`/admin/campaigns?brandId=${brand.id}`} className="flex-1">
                    <button className="w-full text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 justify-center">
                      View Campaigns <FaChevronRight className="h-2.5 w-2.5" />
                    </button>
                  </Link>
                  <Link href={`/admin/campaigns/create?brandId=${brand.id}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all">
                      <FaPlus className="h-2.5 w-2.5" /> Campaign
                    </button>
                  </Link>
                </div>

              </div>
            ))}

            {/* Add brand card */}
            <button onClick={() => { setEditingBrand(null); setShowModal(true); }}
              className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-white/12 bg-transparent p-5 hover:border-emerald-400 dark:hover:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/3 transition-all group flex flex-col items-center justify-center gap-3 min-h-[200px]">
              <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-white/5 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/10 flex items-center justify-center border border-slate-200 dark:border-white/10 group-hover:border-emerald-300 dark:group-hover:border-emerald-500/20 transition-all">
                <FaPlus className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">Add New Brand</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Create and manage independently</p>
              </div>
            </button>
          </div>
        )}

        {/* Summary stats */}
        {brands.length > 0 && (
          <div className="bus-responsive-stat-grid gap-4">
            {[
              { label: "Total Brands", val: brands.length, color: "text-indigo-600 dark:text-indigo-400" },
              { label: "Active Campaigns", val: brands.reduce((s, b) => s + (b.activeCampaigns || 0), 0), color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Total Campaigns", val: brands.reduce((s, b) => s + (b.totalCampaigns || 0), 0), color: "text-blue-600 dark:text-blue-400" },
              { label: "Partners Engaged", val: brands.reduce((s, b) => s + (b.partnersCount || 0), 0), color: "text-purple-600 dark:text-purple-400" },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4 text-center">
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <BrandModal
          brand={editingBrand}
          onClose={() => { setShowModal(false); setEditingBrand(null); }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {deletingBrand && (
        <DeleteConfirmModal
          brand={deletingBrand}
          onClose={() => setDeletingBrand(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </AdminLayout>
  );
};

export default AdminBrandsPage;
