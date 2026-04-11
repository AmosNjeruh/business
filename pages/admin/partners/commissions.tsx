// Business Suite – Partner Commission Management
// Route: /admin/partners/commissions
// Full: tiered commissions, multi-level tracking, automated commission splits

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/Layout";
import {
  FaPercent, FaUsers, FaSpinner, FaPlus, FaEdit, FaTrash, FaCheck,
  FaTimes, FaLayerGroup, FaChartLine, FaMoneyBillWave,
} from "react-icons/fa";

interface Tier {
  id: string;
  name: string;
  minSales: number;
  commissionRate: number;
  description?: string;
}

interface PartnerCommission {
  partnerId: string;
  partnerName: string;
  currentTier: string;
  totalSales: number;
  commissionEarned: number;
  lifetimeValue: number;
  referralLevel?: number;
}

const AdminCommissionsPage: React.FC = () => {
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [partners, setPartners] = useState<PartnerCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTierModal, setShowTierModal] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);

  useEffect(() => {
    // Mock data - replace with API call
    setTiers([
      { id: "1", name: "Bronze", minSales: 0, commissionRate: 5, description: "Entry level" },
      { id: "2", name: "Silver", minSales: 10000, commissionRate: 7.5, description: "10K+ sales" },
      { id: "3", name: "Gold", minSales: 50000, commissionRate: 10, description: "50K+ sales" },
      { id: "4", name: "Platinum", minSales: 100000, commissionRate: 12.5, description: "100K+ sales" },
    ]);
    setPartners([
      {
        partnerId: "1",
        partnerName: "John Doe",
        currentTier: "Gold",
        totalSales: 75000,
        commissionEarned: 7500,
        lifetimeValue: 120000,
        referralLevel: 1,
      },
    ]);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-emerald-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Commission Tiers</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Manage tiered commission rates and multi-level tracking
            </p>
          </div>
          <button
            onClick={() => { setEditingTier(null); setShowTierModal(true); }}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 text-slate-950 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all whitespace-nowrap"
          >
            <FaPlus className="h-3.5 w-3.5" /> Add Tier
          </button>
        </div>

        {/* Stats */}
        <div className="bus-responsive-stat-grid gap-3 sm:gap-4">
          {[
            { label: "Total Tiers", val: tiers.length, color: "text-indigo-600 dark:text-indigo-400", icon: FaLayerGroup },
            { label: "Active Partners", val: partners.length, color: "text-emerald-600 dark:text-emerald-400", icon: FaUsers },
            { label: "Avg Commission", val: "8.5%", color: "text-blue-600 dark:text-blue-400", icon: FaPercent },
            { label: "Total Paid", val: "₦125,000", color: "text-purple-600 dark:text-purple-400", icon: FaMoneyBillWave },
          ].map(({ label, val, color, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-4 w-4 ${color}`} />
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Tiers List */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Commission Tiers</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {tiers.map((tier, index) => (
              <div key={tier.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-slate-950 font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{tier.name}</p>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {tier.commissionRate}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Min sales: ₦{tier.minSales.toLocaleString()} • {tier.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingTier(tier); setShowTierModal(true); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <FaEdit className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-2 rounded-lg text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                    <FaTrash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Performance */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900/70 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Partner Performance</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {partners.map((partner) => (
              <div key={partner.partnerId} className="px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-700 dark:text-white text-xs font-bold">
                    {partner.partnerName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{partner.partnerName}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Tier: <span className="font-semibold text-slate-700 dark:text-slate-300">{partner.currentTier}</span>
                      </span>
                      {partner.referralLevel && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Level {partner.referralLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{partner.commissionEarned.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    LTV: ₦{partner.lifetimeValue.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCommissionsPage;
