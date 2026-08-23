"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Crown,
  ShieldCheck,
  Zap,
  GraduationCap,
  Laptop,
  Smartphone,
  LogOut,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  CreditCard,
  Building,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth-store";
import {
  fetchUserEntitlement,
  fetchUserSessions,
  revokeOtherSessions,
  createPaymentOrder,
  verifyPayment,
  openRazorpayCheckout,
  EntitlementResponse,
  DeviceSession,
} from "@/lib/billing-api";

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<EntitlementResponse | null>(null);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [revokingSessions, setRevokingSessions] = useState(false);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [entData, sessData] = await Promise.all([
        fetchUserEntitlement().catch(() => null),
        fetchUserSessions().catch(() => ({ current_session_id: "", sessions: [] })),
      ]);
      setData(entData);
      setSessions(sessData.sessions || []);
    } catch (err: any) {
      console.error("Failed to load billing data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBillingData();
  }, [user]);

  const handleCheckout = async (planKey: string) => {
    if (!user) {
      router.push("/login?redirect=/billing");
      return;
    }

    try {
      setCheckoutLoading(planKey);
      setActionMessage(null);

      // 1. Create payment order on server
      const order = await createPaymentOrder(planKey);

      if (!order || !order.order_id || !order.key_id) {
        throw new Error("Failed to initialize payment gateway order.");
      }

      // 2. Open live/test Razorpay checkout modal
      await openRazorpayCheckout({
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency || "INR",
        name: "InternPrep AI",
        description: `${order.plan_title} Subscription`,
        order_id: order.order_id,
        prefill: {
          email: user.email,
        },
        theme: {
          color: "#3b82f6",
        },
        handler: async (response) => {
          try {
            setCheckoutLoading(planKey);
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_key: planKey,
            });

            if (verifyRes?.entitlement) {
              setData((prev: any) => ({
                ...(prev || {}),
                entitlement: verifyRes.entitlement,
                is_iitb: Boolean(verifyRes.entitlement.is_iitb),
                is_admin: Boolean(verifyRes.entitlement.is_admin),
              }));
            }

            setActionMessage({
              type: "success",
              text: `🎉 Payment successful! Activated ${order.plan_title}.`,
            });
            await loadBillingData();
          } catch (vErr: any) {
            setActionMessage({
              type: "error",
              text: vErr.message || "Payment verification failed. Please contact support.",
            });
          } finally {
            setCheckoutLoading(null);
          }
        },
        onPaymentFailed: (error) => {
          setCheckoutLoading(null);
          setActionMessage({
            type: "error",
            text: error?.description || error?.reason || "Payment was cancelled or could not be completed.",
          });
        },
        onDismiss: () => {
          setCheckoutLoading(null);
        },
      });
    } catch (err: any) {
      console.error("Checkout error:", err);
      setActionMessage({
        type: "error",
        text: err.message || "Failed to initiate payment. Please try again.",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleRevokeOthers = async () => {
    try {
      setRevokingSessions(true);
      const res = await revokeOtherSessions();
      setActionMessage({
        type: "success",
        text: res.message || "Signed out all other device sessions.",
      });
      await loadBillingData();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: "Failed to sign out other devices.",
      });
    } finally {
      setRevokingSessions(false);
    }
  };

  const entitlement = data?.entitlement;
  const usage = data?.usage || {};
  const isIITB = data?.is_iitb || entitlement?.is_iitb;
  const isAdmin = data?.is_admin || entitlement?.is_admin;
  const isPro = entitlement?.plan_key?.startsWith("pro") || entitlement?.plan_key === "lifetime";

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header / Nav Back */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              ← Back to Dashboard
            </Link>
            <span className="text-border">/</span>
            <span className="text-sm font-semibold text-foreground">Subscriptions & Quotas</span>
          </div>

          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10">
                <ShieldCheck className="h-4 w-4" />
                <span>Admin Console</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-10 space-y-12">
        {/* Status Alerts */}
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="text-xs underline opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <Badge variant="outline" className="px-3 py-1 bg-primary/10 border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            Campus Placement Monetization
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Supercharge Your Placement Preparation
          </h1>
          <p className="text-base text-muted-foreground">
            Get unlimited AI resume critiques, mock case interviews, bullet reconstructions, and company dossiers designed for high-stakes campus recruiting.
          </p>
        </div>

        {/* Current Active Plan Banner */}
        {loading ? (
          <div className="h-28 rounded-2xl bg-card border border-border/40 animate-pulse flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isIITB ? (
          <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500/30 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">IIT Bombay Partner Access Active</h3>
                  <Badge className="bg-emerald-500 text-white font-semibold text-xs">Verified Student</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Signed in as <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">{data?.email}</span>. You receive 30 resume analyses, 15 mock interviews, and 200 bullet variants every month for free!
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold py-1.5 px-4">
              100% Free Campus Access
            </Badge>
          </div>
        ) : isPro ? (
          <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-blue-500/10 to-purple-500/10 border-2 border-primary/40 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-foreground">{entitlement?.plan_name || "InternPrep Pro"} Active</h3>
                  <Badge className="bg-primary text-primary-foreground font-semibold text-xs">Active Subscription</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {entitlement?.expires_at ? (
                    <>
                      Valid until <span className="font-semibold text-foreground">{new Date(entitlement.expires_at).toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" })}</span>
                    </>
                  ) : (
                    "Lifetime Access Active"
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleCheckout("pro_3m")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow"
            >
              Extend Subscription
            </Button>
          </div>
        ) : (
          <div className="rounded-2xl bg-muted/40 border border-border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
                <Sparkles className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Free Starter Tier</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Upgrade to Pro for full mock interviews, 30 resume checks/mo, and company placement intelligence.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-sm font-semibold py-1 px-3">
              Starter Quota
            </Badge>
          </div>
        )}

        {/* Live Monthly Quota Meters */}
        {data && (
          <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Monthly Quota Consumption</h3>
                <p className="text-xs text-muted-foreground">
                  Resets monthly on 1st. Unused quotas do not roll over.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadBillingData} className="text-xs gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resume Analyses Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Resume Analyses</span>
                  <span className="text-muted-foreground font-mono">
                    {usage?.resume_analysis ? `${usage.resume_analysis.used} / ${usage.resume_analysis.limit === -1 ? '∞' : usage.resume_analysis.limit}` : '0 / 2'}
                  </span>
                </div>
                <Progress
                  value={
                    usage?.resume_analysis && usage.resume_analysis.limit > 0
                      ? Math.min(100, (usage.resume_analysis.used / usage.resume_analysis.limit) * 100)
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-[11px] text-muted-foreground">
                  {usage?.resume_analysis?.remaining ?? 2} reviews remaining this month
                </p>
              </div>

              {/* Mock Interviews Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Mock Interviews</span>
                  <span className="text-muted-foreground font-mono">
                    {usage?.mock_interview ? `${usage.mock_interview.used} / ${usage.mock_interview.limit === -1 ? '∞' : usage.mock_interview.limit}` : '0 / 1'}
                  </span>
                </div>
                <Progress
                  value={
                    usage?.mock_interview && usage.mock_interview.limit > 0
                      ? Math.min(100, (usage.mock_interview.used / usage.mock_interview.limit) * 100)
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-[11px] text-muted-foreground">
                  {usage?.mock_interview?.remaining ?? 1} mock sessions remaining
                </p>
              </div>

              {/* Bullet Refinements Meter */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Bullet Refinements</span>
                  <span className="text-muted-foreground font-mono">
                    {usage?.bullet_refine ? `${usage.bullet_refine.used} / ${usage.bullet_refine.limit === -1 ? '∞' : usage.bullet_refine.limit}` : '0 / 10'}
                  </span>
                </div>
                <Progress
                  value={
                    usage?.bullet_refine && usage.bullet_refine.limit > 0
                      ? Math.min(100, (usage.bullet_refine.used / usage.bullet_refine.limit) * 100)
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-[11px] text-muted-foreground">
                  {usage?.bullet_refine?.remaining ?? 10} bullet variants remaining
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3 Pricing Plans Grid */}
        <div className="space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Choose Your Preparation Plan</h2>
            <p className="text-sm text-muted-foreground">
              Instant activation • Secure payment via UPI, Cards, NetBanking, and Wallets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            {/* 1 Month Sprint Pass */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-sm relative"
            >
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Short-Term Sprint
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1">1-Month Sprint Pass</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ideal for fast-track interview rounds in the next 30 days.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 py-2">
                  <span className="text-4xl font-extrabold text-foreground">₹299</span>
                  <span className="text-xs text-muted-foreground">/ 30 days</span>
                </div>

                <ul className="space-y-2.5 text-xs text-muted-foreground border-t border-border/60 pt-4">
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong>30</strong> AI Resume Reviews</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong>15</strong> Full Case & Domain Mocks</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong>200</strong> Bullet Variants & Rewrite Engine</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Company Placement Intelligence Dossiers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Multi-Device Sync (Up to 3 devices)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => handleCheckout("pro_1m")}
                  disabled={checkoutLoading !== null}
                  variant="outline"
                  className="w-full font-semibold border-primary/40 hover:bg-primary/10 text-primary"
                >
                  {checkoutLoading === "pro_1m" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get 1-Month Pass (₹299)"}
                </Button>
              </div>
            </motion.div>

            {/* 3 Month Season Pass (MOST POPULAR) */}
            <motion.div
              whileHover={{ y: -6 }}
              className="rounded-2xl border-2 border-primary bg-primary/5 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
                Most Popular • Save 22%
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Full Season Coverage
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1">Placement Season Pass</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete preparation covering Phase 1 & Phase 2 campus placement drives.
                  </p>
                </div>

                <div className="flex items-baseline gap-2 py-2">
                  <span className="text-4xl font-extrabold text-primary">₹699</span>
                  <span className="text-xs text-muted-foreground line-through">₹897</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">₹233 / mo</span>
                </div>

                <ul className="space-y-2.5 text-xs text-foreground font-medium border-t border-primary/20 pt-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>90 Days</strong> Complete Placement Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>30 Reviews / month</strong> (90 total)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>15 Mock Sessions / month</strong> (45 total)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span><strong>200 Bullet Variants / month</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Priority Low-Latency Model Routing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span>Full Company Intelligence Dossiers</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => handleCheckout("pro_3m")}
                  disabled={checkoutLoading !== null}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg gap-2"
                >
                  {checkoutLoading === "pro_3m" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Get Season Pass (₹699)</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>

            {/* 1 Year Master Pass */}
            <motion.div
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow">
                Best Value • Save 58%
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Comprehensive Master
                  </span>
                  <h3 className="text-xl font-bold text-foreground mt-1">Master Pass (1 Year)</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Year-round preparation for all internships, campus drives, and off-campus opportunities.
                  </p>
                </div>

                <div className="flex items-baseline gap-2 py-2">
                  <span className="text-4xl font-extrabold text-foreground">₹1,499</span>
                  <span className="text-xs text-muted-foreground line-through">₹3,588</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">₹125 / mo</span>
                </div>

                <ul className="space-y-2.5 text-xs text-muted-foreground border-t border-border/60 pt-4">
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span><strong>365 Days</strong> Master Pass</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>All Upcoming AI Interview Domains</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground font-medium">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>30 Reviews / mo & 15 Mocks / mo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Priority 24/7 Placement Support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Continuous Resume Version Sync</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => handleCheckout("pro_1y")}
                  disabled={checkoutLoading !== null}
                  variant="outline"
                  className="w-full font-semibold border-border hover:bg-muted"
                >
                  {checkoutLoading === "pro_1y" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get Master Pass (₹1,499)"}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Active Device Sessions & Remote Logout */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" />
                <span>Active Device Sessions</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage your active logins. You can sign out of other devices remotely for account security.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeOthers}
              disabled={revokingSessions || sessions.length <= 1}
              className="text-xs border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 gap-1.5 shrink-0"
            >
              {revokingSessions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              <span>Sign Out All Other Devices</span>
            </Button>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground">Current session active.</p>
            ) : (
              sessions.map((sess) => {
                const isCurrent = sess.session_id === data?.current_session_id;
                const isMobile = (sess.user_agent || "").toLowerCase().includes("mobile");

                return (
                  <div
                    key={sess.session_id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isCurrent
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                        {isMobile ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{sess.device_name || "Web Browser"}</span>
                          {isCurrent && (
                            <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-[10px] py-0 px-2">
                              This Device
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate max-w-md mt-0.5">
                          Last seen: {new Date(sess.last_seen_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-6">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <span>Frequently Asked Questions</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-muted-foreground">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-sm">How do IIT Bombay students get free access?</h4>
              <p>
                Simply sign in with your official <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">@iitb.ac.in</span> Google account. Our system automatically verifies your domain and gives you full partner access at ₹0.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-sm">What payment methods are supported?</h4>
              <p>
                We accept all major Indian payment methods through Razorpay, including UPI (Google Pay, PhonePe, Paytm, BHIM), all Debit/Credit Cards (Visa, Mastercard, RuPay), and NetBanking across 50+ banks.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-sm">What happens when my subscription ends?</h4>
              <p>
                When your subscription duration finishes, your account smoothly transitions back to the Free Starter Tier with standard monthly starter limits. Your saved bullet banks and interview history will never be lost.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-foreground text-sm">Can I extend or renew before expiry?</h4>
              <p>
                Yes! When you renew or buy another pass, the new duration is automatically added on top of your existing expiration date so you never lose any days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
