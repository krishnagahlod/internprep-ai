"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UploadCloud,
  CheckCircle2,
  RefreshCw,
  Target,
  Loader2,
  Activity,
  Save,
  Layers,
  ArrowLeft,
  ShieldCheck,
  Database,
  Bookmark,
} from "lucide-react";
import { PaywallModal } from "@/components/paywall-modal";
import {
  Achievement,
  GeneratedBullet,
  ROLE_LABELS,
  getRoleLabel,
  resolveBulletSectionType,
  ResumeVaultTab,
  ResumeLabTab,
  ResumePointBankTab,
  ResumeMetricChatModal,
  ResumeEditAchievementModal,
  ResumeFinalUploadModal,
  ResumeDomainPivotModal,
  ResumeStrategyModal,
  ResumeRefineBulletModal,
} from "@/components/resume-builder";

function ResumeBuilderPageContent() {
  const [activeTab, setActiveTab] = useState("vault");
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Vault State
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [vaultSectionFilter, setVaultSectionFilter] = useState<string>("all");
  const [isSyncingVault, setIsSyncingVault] = useState(false);
  const [copiedBulletId, setCopiedBulletId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocumentType, setPdfDocumentType] = useState<"resume" | "other">("resume");
  const [isExtractingPDF, setIsExtractingPDF] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [rawText, setRawText] = useState("");
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [extractionSuccessData, setExtractionSuccessData] = useState<{
    count: number;
    new_count: number;
    merged_count: number;
    achievements: any[];
  } | null>(null);

  // Lab State
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState("consulting");
  const [targetCompany, setTargetCompany] = useState("");
  const [benchmarkText, setBenchmarkText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBullets, setGeneratedBullets] = useState<GeneratedBullet[]>([]);
  const [singleCoachingTips, setSingleCoachingTips] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState("");

  // Section Composer State
  const [labMode, setLabMode] = useState<"single" | "composer">("single");
  const [composerHeading, setComposerHeading] = useState<string | null>(null);
  const [composerSelectedIds, setComposerSelectedIds] = useState<string[]>([]);
  const [composerNumPoints, setComposerNumPoints] = useState(3);
  const [composerResults, setComposerResults] = useState<any>(null);
  const [isComposerGenerating, setIsComposerGenerating] = useState(false);
  const [activeVariantSet, setActiveVariantSet] = useState(0);
  const [customOverviewLines, setCustomOverviewLines] = useState<Record<number, string>>({});

  // Point Bank State
  const [pointBank, setPointBank] = useState<GeneratedBullet[]>([]);
  const [activePointBankRole, setActivePointBankRole] = useState<string>("all");
  const [editingPointBankBullet, setEditingPointBankBullet] = useState<string | null>(null);
  const [editPointBankText, setEditPointBankText] = useState("");
  const [pointBankQuickSaveItem, setPointBankQuickSaveItem] = useState<Achievement | null>(null);

  // Point Bank Final Resume Upload & Filters State
  const [isFinalResumeModalOpen, setIsFinalResumeModalOpen] = useState(false);
  const [finalResumeUploadMode, setFinalResumeUploadMode] = useState<"pdf" | "text">("pdf");
  const [finalResumeFile, setFinalResumeFile] = useState<File | null>(null);
  const [finalResumeText, setFinalResumeText] = useState("");
  const [isExtractingFinalResume, setIsExtractingFinalResume] = useState(false);
  const [pointBankFilter, setPointBankFilter] = useState<"all" | "finalized" | "lab">("all");
  const [finalResumeExtractionSuccessData, setFinalResumeExtractionSuccessData] = useState<{
    saved_bullets_count: number;
    extracted_sections: number;
  } | null>(null);
  const [finalResumeUploadRole, setFinalResumeUploadRole] = useState("consulting");

  // Domain Pivot Engine State
  const [isDomainPivotModalOpen, setIsDomainPivotModalOpen] = useState(false);
  const [pivotSourceRole, setPivotSourceRole] = useState("consulting");
  const [pivotTargetRole, setPivotTargetRole] = useState("software");
  const [pivotTargetCompany, setPivotTargetCompany] = useState("");
  const [pivotSelectedSections, setPivotSelectedSections] = useState<string[]>([]);
  const [isPivotConverting, setIsPivotConverting] = useState(false);
  const [pivotResults, setPivotResults] = useState<any>(null);
  const [pivotAcceptedPoints, setPivotAcceptedPoints] = useState<Record<string, boolean>>({});
  const [pivotEditedPoints, setPivotEditedPoints] = useState<Record<string, string>>({});
  const [isBatchSavingPivot, setIsBatchSavingPivot] = useState(false);
  const [batchSaveSuccessMessage, setBatchSaveSuccessMessage] = useState<string | null>(null);

  // Strategy State
  const [strategyTargetRole, setStrategyTargetRole] = useState("consulting");
  const [strategyDataSource, setStrategyDataSource] = useState("both");
  const [strategyTargetCompany, setStrategyTargetCompany] = useState("");
  const [strategyJobDescription, setStrategyJobDescription] = useState("");
  const [strategyData, setStrategyData] = useState<any>(null);
  const [isStrategyLoading, setIsStrategyLoading] = useState(false);
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);

  // Refs
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Chat State
  const [activeChatAchievement, setActiveChatAchievement] = useState<Achievement | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [pendingMetricsUpdate, setPendingMetricsUpdate] = useState<any>(null);
  const [pendingContextSummary, setPendingContextSummary] = useState("");

  // Refinement Chat State
  const [refineTarget, setRefineTarget] = useState<{
    source: "bank" | "lab_single" | "lab_composer" | "pivot_review";
    id: string;
    text: string;
    role: string;
    composerSetIdx?: number;
    isFinalResume?: boolean;
    charLength?: number;
  } | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refineHistory, setRefineHistory] = useState<
    { instruction: string; result: string; explanation: string }[]
  >([]);

  // API Base
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Paywall Modal State
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallMeta, setPaywallMeta] = useState<{
    title?: string;
    description?: string;
    limit?: number;
    used?: number;
    resetAt?: string;
  }>({});

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) {
      fetchAchievements();
      fetchPointBank();
    }
  }, [mounted, user]);

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login");
    }
  }, [mounted, user, router]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) setActiveTab(tabParam);

    const refineParam = searchParams.get("refine");
    const instructionParam = searchParams.get("instruction");
    const sectionParam = searchParams.get("section");

    if (refineParam && pointBank.length > 0) {
      const bullet = pointBank.find((b) => b.id === refineParam);
      if (bullet) {
        setRefineTarget({
          source: "bank",
          id: bullet.id,
          text: bullet.bullet_text,
          role: bullet.target_role,
        });
        if (instructionParam) {
          setRefineInstruction(decodeURIComponent(instructionParam));
        }
        setRefineHistory([]);

        const url = new URL(window.location.href);
        url.searchParams.delete("refine");
        url.searchParams.delete("instruction");
        if (sectionParam) url.searchParams.delete("section");
        router.replace(url.toString(), undefined);
      }
    }
  }, [searchParams, pointBank, router]);

  const rolesCovered = useMemo(() => {
    const roles = new Set<string>();
    pointBank.forEach((b) => {
      if (b.target_role) roles.add(b.target_role.toLowerCase());
    })
    return roles.size;
  }, [pointBank]);

  const quantifiedRate = useMemo(() => {
    if (pointBank.length === 0) return 0;
    const count = pointBank.filter((b) => /\d/.test(b.bullet_text)).length;
    return Math.round((count / pointBank.length) * 100);
  }, [pointBank]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fetchAchievements = async (retries = 3) => {
    if (!user) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/builder/achievements?user_id=${user.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAchievements(Array.isArray(data) ? data : []);
      } else if (res.status >= 500 && retries > 1) {
        await new Promise((r) => setTimeout(r, 400));
        return fetchAchievements(retries - 1);
      }
    } catch (e) {
      if (retries > 1) {
        await new Promise((r) => setTimeout(r, 400));
        return fetchAchievements(retries - 1);
      }
      console.error("Error fetching achievements:", e);
    }
  };

  const fetchPointBank = async (retries = 3) => {
    if (!user) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPointBank(Array.isArray(data) ? data : []);
      } else if (res.status >= 500 && retries > 1) {
        await new Promise((r) => setTimeout(r, 400));
        return fetchPointBank(retries - 1);
      }
    } catch (e) {
      if (retries > 1) {
        await new Promise((r) => setTimeout(r, 400));
        return fetchPointBank(retries - 1);
      }
      console.error("Error fetching point bank:", e);
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingVault(true);
    await Promise.all([fetchAchievements(), fetchPointBank()]);
    setIsSyncingVault(false);
  };

  const handleFileUpload = async () => {
    if (!file || !user) return;
    setIsExtractingPDF(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user.id);
    formData.append("document_type", pdfDocumentType);

    try {
      const res = await fetch(`${apiBase}/builder/extract/pdf`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setExtractionSuccessData({
          count: data.achievements?.length || 0,
          new_count: data.new_count || 0,
          merged_count: data.merged_count || 0,
          achievements: data.achievements || [],
        });
        await fetchAchievements();
        setFile(null);
      }
    } catch (e) {
      console.error(e);
    }
    setIsExtractingPDF(false);
  };

  const handleTextUpload = async () => {
    if (!rawText.trim() || !user) return;
    setIsExtractingText(true);

    try {
      const res = await fetch(`${apiBase}/builder/extract/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, text: rawText }),
      });
      if (res.ok) {
        const data = await res.json();
        setExtractionSuccessData({
          count: data.achievements?.length || 0,
          new_count: data.new_count || 0,
          merged_count: data.merged_count || 0,
          achievements: data.achievements || [],
        });
        await fetchAchievements();
        setRawText("");
      }
    } catch (e) {
      console.error(e);
    }
    setIsExtractingText(false);
  };

  const handleStrategyRefine = (point_id: string, instruction: string, section?: string) => {
    const bullet = pointBank.find((b) => b.id === point_id);
    if (bullet) {
      setRefineTarget({
        source: "bank",
        id: bullet.id,
        text: bullet.bullet_text,
        role: bullet.target_role,
      });
      if (instruction) setRefineInstruction(instruction);
      if (section) setComposerHeading(section);
      setRefineHistory([]);
      setIsStrategyModalOpen(false);
      setActiveTab("bank");
    }
  };

  const generateVariants = async () => {
    if (!user || !selectedAchievement) return;
    setIsGenerating(true);

    let existing_bullets: string[] = [];
    const achievementObj = achievements.find((a) => a.id === selectedAchievement);
    if (achievementObj) {
      const sibling_achievement_ids = achievements
        .filter((a) => a.parent_experience === achievementObj.parent_experience)
        .map((a) => a.id);

      existing_bullets = pointBank
        .filter((b) => sibling_achievement_ids.includes(b.achievement_id))
        .map((b) => b.bullet_text);
    }

    try {
      const res = await fetch(`${apiBase}/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_id: selectedAchievement,
          target_role: targetRole,
          target_company: targetCompany,
          benchmark_text: benchmarkText,
          existing_bullets: existing_bullets,
          custom_instructions: customInstructions || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const bullets = Array.isArray(data) ? data : data.bullets || [];
        const tips = data.coaching_tips || bullets[0]?.coaching_tips || [];
        if (!bullets || bullets.length === 0) {
          alert("AI generation failed or returned no results. Please try again.");
        } else {
          bullets.forEach((b: any, bIdx: number) => {
            if (!b.id) b.id = `single-bullet-${bIdx}-${crypto.randomUUID()}`;
          });
          setGeneratedBullets(bullets);
          setSingleCoachingTips(tips);
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === "object" ? errorData.detail : {};
          setPaywallMeta({
            title: "Bullet Generation Limit Reached",
            description:
              detail.message ||
              (typeof errorData.detail === "string"
                ? errorData.detail
                : "You have reached your quota limit for AI bullet refinements. Upgrade to Pro for 200 bullet variants/month."),
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at,
          });
          setPaywallOpen(true);
          setIsGenerating(false);
          return;
        }
        alert("Failed to connect to AI generation server. Please try again.");
      }
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const generateSectionBullets = async () => {
    if (!user || composerSelectedIds.length === 0) return;
    setIsComposerGenerating(true);
    try {
      const heading = composerHeading || "";
      const res = await fetch(`${apiBase}/builder/generate-section`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_ids: composerSelectedIds,
          parent_experience: heading,
          target_role: targetRole,
          num_points: composerNumPoints,
          target_company: targetCompany || undefined,
          benchmark_text: benchmarkText || undefined,
          custom_instructions: customInstructions || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data || !data.variant_sets) {
          alert("AI generation failed or returned no results. Please try again.");
        } else {
          data.variant_sets.forEach((set: any, sIdx: number) => {
            set.bullets.forEach((b: any, bIdx: number) => {
              if (!b.id) b.id = `composer-bullet-${sIdx}-${bIdx}-${crypto.randomUUID()}`;
            });
          });
          setComposerResults(data);
          setActiveVariantSet(0);
          setCustomOverviewLines({});
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 403 || errorData.detail?.upgrade_required) {
          const detail = typeof errorData.detail === "object" ? errorData.detail : {};
          setPaywallMeta({
            title: "Section Generation Limit Reached",
            description:
              detail.message ||
              (typeof errorData.detail === "string"
                ? errorData.detail
                : "You have reached your quota limit for AI bullet refinements. Upgrade to Pro for 200 bullet variants/month."),
            limit: detail.limit,
            used: detail.used,
            resetAt: detail.reset_at,
          });
          setPaywallOpen(true);
          setIsComposerGenerating(false);
          return;
        }
        alert("Failed to connect to AI generation server. Please try again.");
      }
    } catch (e) {
      console.error(e);
    }
    setIsComposerGenerating(false);
  };

  const saveBullet = async (bullet: GeneratedBullet, generationGroupId?: string) => {
    if (!user) return;
    try {
      const bodyPayload: any = {
        user_id: user.id,
        achievement_id:
          bullet.achievement_id ||
          bullet.source_achievement_ids?.[0] ||
          composerSelectedIds[0] ||
          "",
        target_role: targetRole,
        bullet_text: bullet.bullet_text,
        variant_type: bullet.variant_type,
        recruiter_notes: bullet.recruiter_notes,
      };
      if (generationGroupId) {
        bodyPayload.generation_group_id = generationGroupId;
      }
      const res = await fetch(`${apiBase}/builder/save-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      if (res.ok) {
        setGeneratedBullets((prev) =>
          prev.map((b) => (b.id === bullet.id ? { ...b, is_saved: true } : b))
        );

        if (composerResults) {
          const newComposerResults = { ...composerResults };
          for (let i = 0; i < newComposerResults.variant_sets.length; i++) {
            newComposerResults.variant_sets[i].bullets = newComposerResults.variant_sets[
              i
            ].bullets.map((b: any) =>
              b.id === bullet.id ? { ...b, is_saved: true } : b
            );
          }
          setComposerResults(newComposerResults);
        }

        fetchPointBank();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditAchievementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchievement) return;
    try {
      const res = await fetch(
        `${apiBase}/builder/achievements/${editingAchievement.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingAchievement),
        }
      );
      if (res.ok) {
        await fetchAchievements();
        setEditingAchievement(null);
      }
    } catch (error) {
      console.error("Failed to edit achievement", error);
    }
  };

  const deleteAchievement = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/achievements/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAchievements((prev) => prev.filter((a) => a.id !== id));
        if (selectedAchievement === id) setSelectedAchievement(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deletePointBankItem = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/point-bank/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPointBank((prev) => prev.filter((b) => b.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePointBankEdit = async (bulletId: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/point-bank/${bulletId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet_text: editPointBankText }),
      });
      if (res.ok) {
        setPointBank(
          pointBank.map((b) =>
            b.id === bulletId ? { ...b, bullet_text: editPointBankText } : b
          )
        );
        setEditingPointBankBullet(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const generateStrategy = async () => {
    if (!user) return;
    setIsStrategyLoading(true);
    try {
      const res = await fetch(`${apiBase}/builder/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          target_role: strategyTargetRole,
          data_source: strategyDataSource,
          target_company: strategyTargetCompany || undefined,
          job_description: strategyJobDescription || undefined,
        }),
      });
      if (res.ok) {
        setStrategyData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsStrategyLoading(false);
    }
  };

  const handleQuickSave = async (domain: string) => {
    if (!user || !pointBankQuickSaveItem) return;
    setPointBankQuickSaveItem(null);
    try {
      const res = await fetch(`${apiBase}/resume-builder/save-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_id: pointBankQuickSaveItem.id,
          target_role: domain.toLowerCase(),
          bullet_text: pointBankQuickSaveItem.original_description,
          variant_type: "raw_extraction",
        }),
      });
      if (res.ok) {
        const savedBullet = await res.json();
        setPointBank((prev) => [savedBullet, ...prev]);
      }
    } catch (e) {
      console.error("Failed to quick save:", e);
    }
  };

  const openFinalResumeModal = () => {
    const defaultRole =
      activePointBankRole === "all"
        ? targetRole
        : Object.keys(ROLE_LABELS).find(
            (k) => ROLE_LABELS[k].toLowerCase() === activePointBankRole.toLowerCase()
          ) || targetRole;
    setFinalResumeUploadRole(defaultRole);
    setIsFinalResumeModalOpen(true);
  };

  const handleFinalResumeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (finalResumeUploadMode === "pdf" && !finalResumeFile) {
      alert("Please select a PDF resume file.");
      return;
    }
    if (finalResumeUploadMode === "text" && !finalResumeText.trim()) {
      alert("Please paste your resume text or LaTeX.");
      return;
    }

    setIsExtractingFinalResume(true);
    try {
      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("target_role", finalResumeUploadRole);
      if (finalResumeUploadMode === "pdf" && finalResumeFile) {
        formData.append("file", finalResumeFile);
      } else if (finalResumeUploadMode === "text") {
        formData.append("raw_text", finalResumeText);
      }

      const res = await fetch(`${apiBase}/builder/extract/final-resume`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setFinalResumeExtractionSuccessData({
          saved_bullets_count: data.saved_bullets_count,
          extracted_sections: data.extracted_sections,
        });
        setIsFinalResumeModalOpen(false);
        setFinalResumeFile(null);
        setFinalResumeText("");
        const bankRes = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`);
        if (bankRes.ok) {
          setPointBank(await bankRes.json());
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to extract resume points. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload and extract resume points.");
    } finally {
      setIsExtractingFinalResume(false);
    }
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refineTarget || !refineInstruction.trim()) return;
    setIsRefining(true);
    try {
      const isFinal = refineTarget.isFinalResume || false;
      const currentText =
        refineHistory.length > 0
          ? refineHistory[refineHistory.length - 1].result
          : refineTarget.text;
      const res = await fetch(`${apiBase}/builder/refine-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_role: refineTarget.role,
          bullet_text: currentText,
          instruction: refineInstruction,
          preserve_length: isFinal,
          target_char_length: isFinal
            ? refineTarget.charLength || refineTarget.text.length
            : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRefineHistory((prev) => [
          ...prev,
          {
            instruction: refineInstruction,
            result: data.refined_bullet,
            explanation: data.explanation,
          },
        ]);
        setRefineInstruction("");
      }
    } catch (e) {
      console.error("Refinement failed:", e);
    } finally {
      setIsRefining(false);
    }
  };

  const acceptRefinement = async () => {
    if (!refineTarget || refineHistory.length === 0) return;
    const newText = refineHistory[refineHistory.length - 1].result;

    if (refineTarget.source === "bank") {
      try {
        const res = await fetch(`${apiBase}/builder/point-bank/${refineTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bullet_text: newText }),
        });
        if (res.ok) {
          setPointBank((prev) =>
            prev.map((b) => (b.id === refineTarget.id ? { ...b, bullet_text: newText } : b))
          );
        }
      } catch (e) {}
    } else if (refineTarget.source === "lab_single") {
      setGeneratedBullets((prev) =>
        prev.map((b) => (b.id === refineTarget.id ? { ...b, bullet_text: newText } : b))
      );
    } else if (
      refineTarget.source === "lab_composer" &&
      refineTarget.composerSetIdx !== undefined
    ) {
      const newResults = { ...composerResults };
      const set = newResults.variant_sets[refineTarget.composerSetIdx];
      set.bullets = set.bullets.map((b: any) =>
        b.id === refineTarget.id ? { ...b, bullet_text: newText } : b
      );
      setComposerResults(newResults);
    } else if (refineTarget.source === "pivot_review") {
      setPivotEditedPoints((prev) => ({
        ...prev,
        [refineTarget.id]: newText,
      }));
    }

    setRefineTarget(null);
    setRefineHistory([]);
    setRefineInstruction("");
  };

  const openDomainPivotModal = () => {
    const availableRoles = Array.from(new Set(pointBank.map((b) => b.target_role)));
    const currentRole =
      activePointBankRole === "all"
        ? availableRoles[0] || "consulting"
        : pointBank.find(
            (b) => getRoleLabel(b.target_role) === getRoleLabel(activePointBankRole)
          )?.target_role || "consulting";

    setPivotSourceRole(currentRole);
    const otherRole =
      DOMAIN_OPTIONS_LIST.find((d) => d.value.toLowerCase() !== currentRole.toLowerCase())
        ?.value || "software";
    setPivotTargetRole(otherRole);
    setPivotTargetCompany("");

    const sourceBullets = pointBank.filter(
      (b) => getRoleLabel(b.target_role) === getRoleLabel(currentRole)
    );
    const sectionsSet = new Set<string>();
    sourceBullets.forEach((b) => {
      const ach = achievements.find((a) => a.id === b.achievement_id);
      const sec = resolveBulletSectionType(b, ach);
      sectionsSet.add(sec);
    });

    const allSecs =
      sectionsSet.size > 0
        ? Array.from(sectionsSet)
        : ["Professional Experience", "Projects", "Positions of Responsibility"];
    setPivotSelectedSections(allSecs);
    setIsDomainPivotModalOpen(true);
  };

  const handleRunDomainPivot = async () => {
    if (!user) return;
    setIsPivotConverting(true);
    try {
      const sourceBullets = pointBank.filter(
        (b) => getRoleLabel(b.target_role) === getRoleLabel(pivotSourceRole)
      );
      const grouped: Record<string, Record<string, any[]>> = {};

      sourceBullets.forEach((b) => {
        const ach = achievements.find((a) => a.id === b.achievement_id);
        const sec = resolveBulletSectionType(b, ach);
        const parent =
          b.achievements?.parent_experience ||
          b.achievements?.title ||
          ach?.parent_experience ||
          ach?.title ||
          "General";
        if (!grouped[sec]) grouped[sec] = {};
        if (!grouped[sec][parent]) grouped[sec][parent] = [];
        grouped[sec][parent].push({
          id: b.id,
          achievement_id: b.achievement_id,
          bullet_text: b.bullet_text,
          variant_type: b.variant_type,
          achievements: b.achievements || ach,
        });
      });

      const rawSections: any[] = [];
      Object.entries(grouped).forEach(([sec, parents]) => {
        if (pivotSelectedSections.length === 0 || pivotSelectedSections.includes(sec)) {
          Object.entries(parents).forEach(([parent, bList]) => {
            const firstBullet = bList[0];
            const ach = achievements.find((a) => a.id === firstBullet?.achievement_id);
            rawSections.push({
              section_type: sec,
              parent_experience: parent,
              timeline: firstBullet?.achievements?.timeline || ach?.timeline || "",
              overview_line:
                firstBullet?.achievements?.original_description ||
                ach?.original_description ||
                "",
              bullets: bList,
            });
          });
        }
      });

      const res = await fetch(`${apiBase}/builder/convert-domain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          source_role: pivotSourceRole,
          target_role: pivotTargetRole,
          target_company: pivotTargetCompany,
          sections_to_convert: pivotSelectedSections,
          raw_sections: rawSections.length > 0 ? rawSections : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setPivotResults(data);

        const initialAccepted: Record<string, boolean> = {};
        data.sections?.forEach((sec: any) => {
          sec.point_conversions?.forEach((pt: any) => {
            initialAccepted[pt.id] =
              !pt.is_flagged && pt.conversion_confidence !== "not_convertible";
          });
        });
        setPivotAcceptedPoints(initialAccepted);
        setPivotEditedPoints({});
        setIsDomainPivotModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to convert domain resume. Please try again.");
      }
    } catch (err) {
      console.error("Domain pivot error:", err);
      alert("An error occurred during domain conversion. Please try again.");
    } finally {
      setIsPivotConverting(false);
    }
  };

  const handleSaveAllPivotAccepted = async () => {
    if (!user || !pivotResults) return;
    setIsBatchSavingPivot(true);
    try {
      const bulletsToSave: any[] = [];

      pivotResults.sections?.forEach((sec: any) => {
        sec.point_conversions?.forEach((pt: any) => {
          if (pivotAcceptedPoints[pt.id]) {
            const textToSave =
              pivotEditedPoints[pt.id] || pt.converted_text || pt.original_text;
            if (textToSave && textToSave.trim()) {
              bulletsToSave.push({
                achievement_id: pt.achievement_id,
                target_role: pivotResults.target_domain || pivotTargetRole,
                bullet_text: textToSave.trim(),
                variant_type: "domain_pivot",
                parent_experience: sec.parent_experience,
                section_type: sec.section_type,
              });
            }
          }
        });
      });

      if (bulletsToSave.length === 0) {
        alert("No points are selected to save.");
        setIsBatchSavingPivot(false);
        return;
      }

      const res = await fetch(`${apiBase}/builder/save-bullets-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          bullets: bulletsToSave,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBatchSaveSuccessMessage(
          `Successfully saved ${data.count} points to ${getRoleLabel(
            pivotResults.target_domain || pivotTargetRole
          )} Point Bank!`
        );
        const bankRes = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`);
        if (bankRes.ok) {
          setPointBank(await bankRes.json());
        }
        setActivePointBankRole(
          getRoleLabel(pivotResults.target_domain || pivotTargetRole)
        );
        setPivotResults(null);
        setTimeout(() => setBatchSaveSuccessMessage(null), 6000);
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to save points to Point Bank.");
      }
    } catch (err) {
      console.error("Save batch error:", err);
      alert("Failed to save converted points.");
    } finally {
      setIsBatchSavingPivot(false);
    }
  };

  const sendChatMessage = async (forceStart = false) => {
    if (!activeChatAchievement || (!chatInput.trim() && !forceStart) || !user) return;

    const newMessages = chatInput.trim()
      ? [...chatMessages, { role: "user", content: chatInput }]
      : chatMessages;
    setChatMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch(`${apiBase}/builder/metric-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievement_id: activeChatAchievement.id,
          messages: newMessages,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages([...newMessages, { role: "assistant", content: data.response }]);

        if (
          data.extracted_metrics_update &&
          Object.keys(data.extracted_metrics_update).length > 0
        ) {
          setPendingMetricsUpdate(data.extracted_metrics_update);
        }
        if (data.new_context_summary) {
          setPendingContextSummary(data.new_context_summary);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setIsChatLoading(false);
  };

  const applyMetricsToVault = async () => {
    if (!activeChatAchievement) return;
    setIsChatLoading(true);

    try {
      const existingMetrics = activeChatAchievement.quantified_metrics || {};
      const updatedMetrics = { ...existingMetrics, ...(pendingMetricsUpdate || {}) };

      const existingNotes = activeChatAchievement.user_notes || "";
      const newNotes = pendingContextSummary
        ? existingNotes
          ? `${existingNotes}\n${pendingContextSummary}`
          : pendingContextSummary
        : existingNotes;

      const updateData: any = { quantified_metrics: updatedMetrics };
      if (newNotes) updateData.user_notes = newNotes;

      const res = await fetch(
        `${apiBase}/builder/achievements/${activeChatAchievement.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );
      if (res.ok) {
        await fetchAchievements();
        setActiveChatAchievement(null);
        setPendingMetricsUpdate(null);
        setPendingContextSummary("");
      }
    } catch (e) {
      console.error(e);
    }
    setIsChatLoading(false);
  };

  const availablePivotSections = useMemo(() => {
    const sourceBullets = pointBank.filter(
      (b) => getRoleLabel(b.target_role) === getRoleLabel(pivotSourceRole)
    );
    return Array.from(
      new Set(
        sourceBullets.map((b) => {
          const ach = achievements.find((a) => a.id === b.achievement_id);
          return resolveBulletSectionType(b, ach);
        })
      )
    );
  }, [pointBank, pivotSourceRole, achievements]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Sticky Top Navbar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs font-mono-tech cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Dashboard
            </Button>
            <span className="text-border">/</span>
            <span className="text-xs font-mono-tech text-muted-foreground">
              RESUME BUILDER & VAULT
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAll}
              disabled={isSyncingVault}
              className="text-xs font-mono-tech h-8 border-border cursor-pointer"
            >
              <RefreshCw
                className={`h-3 w-3 mr-1.5 ${isSyncingVault ? "animate-spin" : ""}`}
              />{" "}
              Sync Vault
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 max-w-6xl px-4 sm:px-6 space-y-8 flex-1">
        {/* Placement Command Header */}
        <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [DAY 1 PLACEMENT CALIBRATED]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">
                MULTI-ROLE RESUME STUDIO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
              Resume Builder & Achievement Vault
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-sans">
              Store your raw achievements once. Compose, benchmark, and pivot tailored bullet points across 5 placement domains with verified Day 1 quality.
            </p>
          </div>
        </div>

        {/* 4-KPI Metric Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono-tech">
          <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
            <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
              <span>RAW ACHIEVEMENTS</span>
              <Database className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{achievements.length}</div>
            <div className="text-[10px] text-muted-foreground font-sans">Extracted across all sections</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
            <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
              <span>POINT BANK BULLETS</span>
              <Bookmark className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{pointBank.length}</div>
            <div className="text-[10px] text-muted-foreground font-sans">Day 1 placement-ready variants</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
            <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
              <span>ROLE COVERAGE</span>
              <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{rolesCovered} / 5 Roles</div>
            <div className="text-[10px] text-muted-foreground font-sans">Consulting, SDE, PM, Finance, Analytics</div>
          </div>

          <div className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-1">
            <div className="text-[11px] uppercase text-muted-foreground flex items-center justify-between">
              <span>QUANTIFICATION RATE</span>
              <ShieldCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-foreground">{quantifiedRate}%</div>
            <div className="text-[10px] text-muted-foreground font-sans">Bullets with quantified metrics</div>
          </div>
        </div>

        {/* 3 Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full space-y-8">
          <TabsList className="flex flex-col sm:flex-row w-full h-auto bg-muted/40 p-1.5 rounded-2xl shadow-2xs border border-border">
            <TabsTrigger
              value="vault"
              className="flex-1 py-2.5 text-xs sm:text-sm font-semibold font-mono-tech rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs data-[state=active]:text-foreground transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 mr-2 text-primary" /> 1. Achievement Vault ({achievements.length})
            </TabsTrigger>
            <TabsTrigger
              value="lab"
              className="flex-1 py-2.5 text-xs sm:text-sm font-semibold font-mono-tech rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs data-[state=active]:text-foreground transition-all cursor-pointer"
            >
              <Activity className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" /> 2. Bullet Laboratory & Composer
            </TabsTrigger>
            <TabsTrigger
              value="bank"
              className="flex-1 py-2.5 text-xs sm:text-sm font-semibold font-mono-tech rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xs data-[state=active]:text-foreground transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> 3. Point Bank & Strategy ({pointBank.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VAULT */}
          <TabsContent value="vault">
            <ResumeVaultTab
              achievements={achievements}
              vaultSectionFilter={vaultSectionFilter}
              setVaultSectionFilter={setVaultSectionFilter}
              file={file}
              setFile={setFile}
              pdfDocumentType={pdfDocumentType}
              setPdfDocumentType={setPdfDocumentType}
              isExtractingPDF={isExtractingPDF}
              handleFileUpload={handleFileUpload}
              rawText={rawText}
              setRawText={setRawText}
              isExtractingText={isExtractingText}
              handleTextUpload={handleTextUpload}
              extractionSuccessData={extractionSuccessData}
              setExtractionSuccessData={setExtractionSuccessData}
              onQuickSave={(ach) => setPointBankQuickSaveItem(ach)}
              onEdit={(ach) => setEditingAchievement(ach)}
              onDelete={(id) => deleteAchievement(id)}
              onOpenChat={(ach) => {
                setActiveChatAchievement(ach);
                setChatMessages([]);
                setPendingMetricsUpdate(null);
                setPendingContextSummary("");
              }}
              onGoToLab={(id) => {
                setSelectedAchievement(id);
                setActiveTab("lab");
              }}
            />
          </TabsContent>

          {/* TAB 2: LAB */}
          <TabsContent value="lab">
            <ResumeLabTab
              labMode={labMode}
              setLabMode={setLabMode}
              achievements={achievements}
              selectedAchievement={selectedAchievement}
              setSelectedAchievement={setSelectedAchievement}
              composerHeading={composerHeading}
              setComposerHeading={setComposerHeading}
              composerSelectedIds={composerSelectedIds}
              setComposerSelectedIds={setComposerSelectedIds}
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              targetCompany={targetCompany}
              setTargetCompany={setTargetCompany}
              benchmarkText={benchmarkText}
              setBenchmarkText={setBenchmarkText}
              composerNumPoints={composerNumPoints}
              setComposerNumPoints={setComposerNumPoints}
              customInstructions={customInstructions}
              setCustomInstructions={setCustomInstructions}
              isGenerating={isGenerating}
              generateVariants={generateVariants}
              isComposerGenerating={isComposerGenerating}
              generateSectionBullets={generateSectionBullets}
              generatedBullets={generatedBullets}
              singleCoachingTips={singleCoachingTips}
              composerResults={composerResults}
              activeVariantSet={activeVariantSet}
              setActiveVariantSet={setActiveVariantSet}
              customOverviewLines={customOverviewLines}
              setCustomOverviewLines={setCustomOverviewLines}
              saveBullet={saveBullet}
              onOpenRefine={(target) => {
                setRefineTarget(target);
                setRefineInstruction("");
                setRefineHistory([]);
              }}
            />
          </TabsContent>

          {/* TAB 3: POINT BANK */}
          <TabsContent value="bank">
            <ResumePointBankTab
              pointBank={pointBank}
              activePointBankRole={activePointBankRole}
              setActivePointBankRole={setActivePointBankRole}
              pointBankFilter={pointBankFilter}
              setPointBankFilter={setPointBankFilter}
              achievements={achievements}
              editingPointBankBullet={editingPointBankBullet}
              setEditingPointBankBullet={setEditingPointBankBullet}
              editPointBankText={editPointBankText}
              setEditPointBankText={setEditPointBankText}
              copiedBulletId={copiedBulletId}
              setCopiedBulletId={setCopiedBulletId}
              pivotResults={pivotResults}
              setPivotResults={setPivotResults}
              pivotAcceptedPoints={pivotAcceptedPoints}
              setPivotAcceptedPoints={setPivotAcceptedPoints}
              pivotEditedPoints={pivotEditedPoints}
              isBatchSavingPivot={isBatchSavingPivot}
              batchSaveSuccessMessage={batchSaveSuccessMessage}
              setBatchSaveSuccessMessage={setBatchSaveSuccessMessage}
              openFinalResumeModal={openFinalResumeModal}
              openDomainPivotModal={openDomainPivotModal}
              openStrategyModal={() => {
                const rawRole =
                  pointBank.find(
                    (b) => getRoleLabel(b.target_role) === getRoleLabel(activePointBankRole)
                  )?.target_role || "consulting";
                setStrategyTargetRole(rawRole);
                setIsStrategyModalOpen(true);
              }}
              onSavePointBankEdit={handleSavePointBankEdit}
              onDeletePointBankItem={deletePointBankItem}
              onSaveAllPivotAccepted={handleSaveAllPivotAccepted}
              onOpenRefine={(target) => {
                setRefineTarget(target);
                setRefineInstruction("");
                setRefineHistory([]);
              }}
              onGoToLab={() => setActiveTab("lab")}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* METRICS DISCOVERY CHAT MODAL */}
      <ResumeMetricChatModal
        activeAchievement={activeChatAchievement}
        onClose={() => setActiveChatAchievement(null)}
        chatMessages={chatMessages}
        isChatLoading={isChatLoading}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSendMessage={sendChatMessage}
        pendingMetricsUpdate={pendingMetricsUpdate}
        pendingContextSummary={pendingContextSummary}
        onApplyMetrics={applyMetricsToVault}
        chatScrollRef={chatScrollRef}
      />

      {/* EDIT ACHIEVEMENT MODAL */}
      <ResumeEditAchievementModal
        achievement={editingAchievement}
        onClose={() => setEditingAchievement(null)}
        onSave={handleEditAchievementSubmit}
        onChange={(upd) => setEditingAchievement(upd)}
      />

      {/* FINAL RESUME UPLOAD MODAL */}
      <ResumeFinalUploadModal
        open={isFinalResumeModalOpen}
        onClose={() => setIsFinalResumeModalOpen(false)}
        uploadMode={finalResumeUploadMode}
        setUploadMode={setFinalResumeUploadMode}
        file={finalResumeFile}
        setFile={setFinalResumeFile}
        text={finalResumeText}
        setText={setFinalResumeText}
        role={finalResumeUploadRole}
        setRole={setFinalResumeUploadRole}
        isExtracting={isExtractingFinalResume}
        onSubmit={handleFinalResumeUpload}
      />

      {/* DOMAIN PIVOT MODAL */}
      <ResumeDomainPivotModal
        open={isDomainPivotModalOpen}
        onClose={() => setIsDomainPivotModalOpen(false)}
        sourceRole={pivotSourceRole}
        setSourceRole={setPivotSourceRole}
        targetRole={pivotTargetRole}
        setTargetRole={setPivotTargetRole}
        targetCompany={pivotTargetCompany}
        setTargetCompany={setPivotTargetCompany}
        selectedSections={pivotSelectedSections}
        setSelectedSections={setPivotSelectedSections}
        availableSections={availablePivotSections}
        isConverting={isPivotConverting}
        onSubmit={handleRunDomainPivot}
      />

      {/* STRATEGY MODAL */}
      <ResumeStrategyModal
        open={isStrategyModalOpen}
        onClose={() => setIsStrategyModalOpen(false)}
        strategyData={strategyData}
        setStrategyData={setStrategyData}
        strategyTargetRole={strategyTargetRole}
        setStrategyTargetRole={setStrategyTargetRole}
        strategyDataSource={strategyDataSource}
        setStrategyDataSource={setStrategyDataSource}
        strategyTargetCompany={strategyTargetCompany}
        setStrategyTargetCompany={setStrategyTargetCompany}
        strategyJobDescription={strategyJobDescription}
        setStrategyJobDescription={setStrategyJobDescription}
        isStrategyLoading={isStrategyLoading}
        onGenerateStrategy={generateStrategy}
        onStrategyRefine={handleStrategyRefine}
      />

      {/* REFINE BULLET MODAL */}
      <ResumeRefineBulletModal
        refineTarget={refineTarget}
        onClose={() => setRefineTarget(null)}
        refineInstruction={refineInstruction}
        setRefineInstruction={setRefineInstruction}
        refineHistory={refineHistory}
        isRefining={isRefining}
        onRefineSubmit={handleRefineSubmit}
        onAcceptRefinement={acceptRefinement}
      />

      {/* Quick Save to Point Bank Dialog */}
      <Dialog
        open={!!pointBankQuickSaveItem}
        onOpenChange={(open) => !open && setPointBankQuickSaveItem(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary text-xl font-display">
              <Save className="h-5 w-5" /> Save to Point Bank
            </DialogTitle>
            <DialogDescription className="font-mono-tech text-xs">
              Select the target domain to save this raw achievement under in your Point Bank.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4 font-mono-tech">
            {Array.from(new Set(Object.values(ROLE_LABELS))).map((domain) => (
              <Button
                key={domain}
                variant="outline"
                className="h-12 justify-start font-medium hover:bg-primary hover:text-primary-foreground border-primary/20 shadow-2xs rounded-xl cursor-pointer text-xs"
                onClick={() => handleQuickSave(domain)}
              >
                {domain}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Final Resume Extraction Success Notification Dialog */}
      <Dialog
        open={!!finalResumeExtractionSuccessData}
        onOpenChange={(open) => !open && setFinalResumeExtractionSuccessData(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
          <div className="p-6 pb-4 border-b bg-emerald-50 dark:bg-emerald-950/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl text-emerald-700 dark:text-emerald-400 font-display">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                Extraction Complete!
              </DialogTitle>
              <DialogDescription className="text-xs pt-2 text-foreground/80 font-mono-tech">
                We successfully extracted and saved{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {finalResumeExtractionSuccessData?.saved_bullets_count}
                </strong>{" "}
                finalized resume points across{" "}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {finalResumeExtractionSuccessData?.extracted_sections}
                </strong>{" "}
                sections into your Point Bank!
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 bg-muted/10 flex flex-col items-center justify-center text-center">
            <Target className="h-16 w-16 text-emerald-500/20 mb-4" />
            <p className="text-xs text-muted-foreground max-w-sm font-mono-tech">
              These points are now permanently locked in length and pinned to the top of your Point Bank for easy access.
            </p>
          </div>

          <div className="p-4 border-t bg-background flex justify-end font-mono-tech">
            <Button
              onClick={() => setFinalResumeExtractionSuccessData(null)}
              className="w-full sm:w-auto font-medium px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
              size="lg"
            >
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paywall Quota Modal */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        title={paywallMeta.title}
        description={paywallMeta.description}
        limit={paywallMeta.limit}
        used={paywallMeta.used}
        resetAt={paywallMeta.resetAt}
      />
    </div>
  );
}

const DOMAIN_OPTIONS_LIST = [
  { value: "consulting", label: "Management Consulting" },
  { value: "software", label: "Software Engineering / IT" },
  { value: "product_management", label: "Product Management" },
  { value: "finance", label: "Finance / Investment Banking" },
  { value: "analytics", label: "Data Science & Analytics" },
];

export default function ResumeBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center p-8">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <ResumeBuilderPageContent />
    </Suspense>
  );
}
