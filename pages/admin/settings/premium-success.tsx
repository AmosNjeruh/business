// Business Suite — Vendor Premium payment confirmation (Stripe / Paystack)

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import AdminLayout from '@/components/admin/Layout';
import { verifyPaystackPayment, activateVendorPremium } from '@/services/vendor';
import { FaSpinner, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';

const PremiumSuccessPage: React.FC = () => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { vendorId, type, paymentMethod, reference, session_id } = router.query;
      const paystackRef = (reference || router.query.trxref) as string | undefined;

      if (!router.isReady || !vendorId) return;

      if (type !== 'vendor_premium') {
        router.replace('/admin/settings?premium=1');
        return;
      }

      const key = `vendor_premium_ok_${paystackRef || session_id || 'unknown'}`;
      if (sessionStorage.getItem(key)) {
        setIsProcessing(false);
        return;
      }

      try {
        if (paymentMethod === 'paystack' && paystackRef) {
          await verifyPaystackPayment(paystackRef);
          await activateVendorPremium({ paymentMethod: 'paystack', reference: paystackRef });
        } else if (paymentMethod === 'stripe' || session_id) {
          const sid = session_id as string | undefined;
          if (!sid) {
            setError('Missing Stripe session. Return to settings and try again.');
            setIsProcessing(false);
            return;
          }
          await activateVendorPremium({ paymentMethod: 'stripe', sessionId: sid });
        } else {
          setError('Could not determine payment method.');
          setIsProcessing(false);
          return;
        }

        sessionStorage.setItem(key, '1');
        toast.success('Vendor Premium is active');
        setIsProcessing(false);
      } catch (e: any) {
        const msg =
          e?.response?.data?.error || e?.message || 'Could not confirm payment. Contact support if you were charged.';
        setError(msg);
        setIsProcessing(false);
        toast.error(msg);
      }
    };

    run();
  }, [router.isReady, router.query, router]);

  return (
    <AdminLayout>
      <div className="relative flex min-h-[70vh] flex-col items-center justify-center p-4">
        <Link
          href="/admin/settings?premium=1"
          className="absolute left-4 top-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <FaArrowLeft className="h-3.5 w-3.5" />
          Back to settings
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-slate-900/80">
          {isProcessing ? (
            <>
              <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Confirming Vendor Premium</h1>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">One moment…</p>
              <FaSpinner className="mx-auto h-10 w-10 animate-spin text-emerald-500" />
            </>
          ) : error ? (
            <>
              <h1 className="mb-2 text-xl font-bold text-red-600 dark:text-red-400">Something went wrong</h1>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">{error}</p>
              <Link
                href="/admin/settings?premium=1"
                className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Return to Vendor Premium
              </Link>
            </>
          ) : (
            <>
              <FaCheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
              <h1 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">You&apos;re all set</h1>
              <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                Vendor Premium is active for this workspace. Emails and the AI assistant are unlocked.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Link
                  href="/admin/emails"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Open Emails
                </Link>
                <Link
                  href="/admin"
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                >
                  Dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PremiumSuccessPage;
