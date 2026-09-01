"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  UploadCloud,
  RefreshCw,
  Target,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Sparkles,
  Layers,
  Copy,
  Check,
  Edit3,
  Trash2,
  Info,
  Loader2,
} from "lucide-react";
import {
  Achievement,
  GeneratedBullet,
  getRoleLabel,
  highlightMetrics,
  resolveBulletSectionType,
  SECTION_ORDER,
} from "./types";

interface ResumePointBankTabProps {
  pointBank: GeneratedBullet[];
  activePointBankRole: string;
  setActivePointBankRole: (role: string) => void;
  pointBankFilter: "all" | "finalized" | "lab";
  setPointBankFilter: (filter: "all" | "finalized" | "lab") => void;
  achievements: Achievement[];
  editingPointBankBullet: string | null;
  setEditingPointBankBullet: (id: string | null) => void;
  editPointBankText: string;
  setEditPointBankText: (text: string) => void;
  copiedBulletId: string | null;
  setCopiedBulletId: (id: string | null) => void;
  pivotResults: any;
  setPivotResults: (res: any) => void;
  pivotAcceptedPoints: Record<string, boolean>;
  setPivotAcceptedPoints: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  pivotEditedPoints: Record<string, string>;
  isBatchSavingPivot: boolean;
  batchSaveSuccessMessage: string | null;
  setBatchSaveSuccessMessage: (msg: string | null) => void;
  openFinalResumeModal: () => void;
  openDomainPivotModal: () => void;
  openStrategyModal: () => void;
  onSavePointBankEdit: (id: string) => Promise<void>;
  onDeletePointBankItem: (id: string) => Promise<void>;
  onSaveAllPivotAccepted: () => Promise<void>;
  onOpenRefine: (target: any) => void;
  onGoToLab: () => void;
}

export function ResumePointBankTab({
  pointBank,
  activePointBankRole,
  setActivePointBankRole,
  pointBankFilter,
  setPointBankFilter,
  achievements,
  editingPointBankBullet,
  setEditingPointBankBullet,
  editPointBankText,
  setEditPointBankText,
  copiedBulletId,
  setCopiedBulletId,
  pivotResults,
  setPivotResults,
  pivotAcceptedPoints,
  setPivotAcceptedPoints,
  pivotEditedPoints,
  isBatchSavingPivot,
  batchSaveSuccessMessage,
  setBatchSaveSuccessMessage,
  openFinalResumeModal,
  openDomainPivotModal,
  openStrategyModal,
  onSavePointBankEdit,
  onDeletePointBankItem,
  onSaveAllPivotAccepted,
  onOpenRefine,
  onGoToLab,
}: ResumePointBankTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="border-border/60 shadow-md rounded-3xl">
        <CardHeader className="border-b bg-muted/5 pb-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2 font-display">
                <Save className="h-6 w-6 text-primary" /> Point Bank
              </CardTitle>
              <CardDescription className="text-sm mt-1 font-sans">
                Your unified repository of saved points. Points extracted from your finalized domain resumes appear alongside points drafted in the Laboratory.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 font-mono-tech">
              <Button
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs flex items-center gap-1.5 rounded-xl cursor-pointer text-xs h-9"
                onClick={openFinalResumeModal}
              >
                <UploadCloud className="h-4 w-4" /> Upload Finalized Resume
              </Button>
              <Button
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 font-bold shadow-xs flex items-center gap-1.5 rounded-xl cursor-pointer text-xs h-9"
                onClick={openDomainPivotModal}
                disabled={pointBank.length === 0}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Pivot Domain
              </Button>
              <Button
                onClick={openStrategyModal}
                variant="outline"
                className="font-semibold shadow-xs rounded-xl cursor-pointer text-xs h-9"
              >
                <Target className="h-3.5 w-3.5 mr-1.5 text-primary" /> Strategy Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {batchSaveSuccessMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5 font-mono-tech text-xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">{batchSaveSuccessMessage}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBatchSaveSuccessMessage(null)}
                className="h-7 text-xs font-mono-tech cursor-pointer"
              >
                Dismiss
              </Button>
            </div>
          )}

          {/* DOMAIN PIVOT ACTIVE REVIEW */}
          {pivotResults ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-muted/30 to-background border border-primary/30 shadow-md">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 font-mono-tech">
                      <Badge className="bg-primary text-primary-foreground font-bold px-3 py-1 text-xs">
                        <RefreshCw className="h-3 w-3 mr-1" /> Domain Pivot Studio
                      </Badge>
                      {pivotResults.target_company && (
                        <Badge variant="outline" className="border-primary/40 text-foreground font-medium">
                          Focus: {pivotResults.target_company}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-2xl font-extrabold text-foreground flex items-center gap-2 font-display">
                      <span>{pivotResults.source_domain_label || getRoleLabel(pivotResults.source_domain)}</span>
                      <ArrowRight className="h-5 w-5 text-primary" />
                      <span className="text-primary">{pivotResults.target_domain_label || getRoleLabel(pivotResults.target_domain)}</span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-2xl font-mono-tech">
                      Review your side-by-side reframed points. Character lengths are strictly preserved for 1-page template line budgets.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono-tech">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPivotResults(null)}
                      className="font-medium shadow-xs rounded-xl cursor-pointer"
                    >
                      Exit Review
                    </Button>
                    <Button
                      onClick={onSaveAllPivotAccepted}
                      disabled={isBatchSavingPivot || Object.values(pivotAcceptedPoints).filter(Boolean).length === 0}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md flex items-center gap-2 rounded-xl cursor-pointer text-xs"
                    >
                      {isBatchSavingPivot ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Save {Object.values(pivotAcceptedPoints).filter(Boolean).length} Points
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Summary KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-border/60 font-mono-tech">
                  <div className="p-3 bg-background/80 rounded-2xl border shadow-2xs">
                    <div className="text-[10px] text-muted-foreground font-bold uppercase">Total Points</div>
                    <div className="text-xl font-extrabold text-foreground mt-0.5">{pivotResults.total_points}</div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl shadow-2xs">
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Converted
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {pivotResults.converted_points_count}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl shadow-2xs">
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Flagged
                    </div>
                    <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                      {pivotResults.flagged_points_count}
                    </div>
                  </div>
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl shadow-2xs">
                    <div className="text-[10px] text-primary font-bold uppercase flex items-center gap-1">
                      <CheckSquare className="h-3.5 w-3.5" /> Selected
                    </div>
                    <div className="text-xl font-extrabold text-primary mt-0.5">
                      {Object.values(pivotAcceptedPoints).filter(Boolean).length} / {pivotResults.total_points}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section by Section Side-by-Side Review */}
              <div className="space-y-6">
                {pivotResults.sections?.map((sec: any, secIdx: number) => (
                  <Card key={secIdx} className="border-border/70 shadow-xs overflow-hidden rounded-3xl">
                    <CardHeader className="bg-muted/15 border-b pb-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider mb-1 bg-background font-mono-tech">
                            {sec.section_type}
                          </Badge>
                          <CardTitle className="text-base font-bold flex items-center gap-2 font-display">
                            <Target className="h-4 w-4 text-primary" /> {sec.parent_experience}
                            {sec.timeline && (
                              <span className="text-xs font-normal text-muted-foreground font-mono-tech">
                                ({sec.timeline})
                              </span>
                            )}
                          </CardTitle>
                        </div>

                        <div className="flex items-center gap-2 font-mono-tech">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-primary hover:bg-primary/10 cursor-pointer"
                            onClick={() => {
                              const next = { ...pivotAcceptedPoints };
                              const allSecChecked = sec.point_conversions.every((pt: any) => next[pt.id]);
                              sec.point_conversions.forEach((pt: any) => {
                                if (!pt.is_flagged || allSecChecked) {
                                  next[pt.id] = !allSecChecked;
                                }
                              });
                              setPivotAcceptedPoints(next);
                            }}
                          >
                            {sec.point_conversions.every((pt: any) => pivotAcceptedPoints[pt.id])
                              ? "Deselect Section"
                              : "Select Section"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-5 space-y-4">
                      {sec.point_conversions?.map((pt: any, ptIdx: number) => {
                        const isAccepted = Boolean(pivotAcceptedPoints[pt.id]);
                        const isFlagged = pt.is_flagged || pt.conversion_confidence === "not_convertible";
                        const currentConvertedText = pivotEditedPoints[pt.id] || pt.converted_text;
                        const charDiff = currentConvertedText
                          ? currentConvertedText.length - pt.original_char_length
                          : 0;

                        return (
                          <div
                            key={pt.id || ptIdx}
                            className={`rounded-2xl border transition-all p-4 ${
                              isFlagged
                                ? "border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20"
                                : isAccepted
                                ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/15 shadow-2xs"
                                : "border-border/60 bg-background hover:bg-muted/10 opacity-75"
                            }`}
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start font-sans">
                              {/* Left: Original Point */}
                              <div className="lg:col-span-5 space-y-2 border-b lg:border-b-0 lg:border-r border-border/60 pb-3 lg:pb-0 lg:pr-4">
                                <div className="flex items-center justify-between font-mono-tech">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    Original ({pivotResults.source_domain_label || "Source"})
                                  </span>
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {pt.original_char_length} chars
                                  </span>
                                </div>
                                <div className="text-[14px] leading-relaxed text-foreground/90 font-normal">
                                  {highlightMetrics(pt.original_text)}
                                </div>
                              </div>

                              {/* Right: Converted Point */}
                              <div className="lg:col-span-7 space-y-2.5">
                                <div className="flex flex-wrap items-center justify-between gap-2 font-mono-tech">
                                  <div className="flex items-center gap-2">
                                    {isFlagged ? (
                                      <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50 text-[10px] font-bold uppercase gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Flagged / Inconvertible
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50 text-[10px] font-bold uppercase gap-1">
                                        <Sparkles className="h-3 w-3" /> {pt.conversion_confidence || "Converted"}
                                      </Badge>
                                    )}
                                    {currentConvertedText && (
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        {currentConvertedText.length} chars (
                                        <span
                                          className={
                                            Math.abs(charDiff) <= 5
                                              ? "text-emerald-600 font-bold"
                                              : "text-amber-600 font-bold"
                                          }
                                        >
                                          {charDiff > 0 ? `+${charDiff}` : charDiff}
                                        </span>
                                        )
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {currentConvertedText && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                                        onClick={() =>
                                          onOpenRefine({
                                            source: "pivot_review",
                                            id: pt.id,
                                            text: currentConvertedText,
                                            role: pivotResults.target_domain,
                                            isFinalResume: true,
                                            charLength: pt.original_char_length,
                                          })
                                        }
                                      >
                                        <Sparkles className="h-3.5 w-3.5" /> AI Refine
                                      </Button>
                                    )}
                                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-foreground">
                                      <input
                                        type="checkbox"
                                        checked={isAccepted}
                                        onChange={(e) => {
                                          setPivotAcceptedPoints((prev) => ({
                                            ...prev,
                                            [pt.id]: e.target.checked,
                                          }));
                                        }}
                                        className="h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer"
                                      />
                                      {isAccepted ? "Accepted" : "Include"}
                                    </label>
                                  </div>
                                </div>

                                {isFlagged ? (
                                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                                    <p className="font-semibold">Why this point was flagged:</p>
                                    <p className="leading-relaxed">{pt.conversion_notes}</p>
                                  </div>
                                ) : (
                                  <div className="text-[14px] leading-relaxed text-foreground font-medium bg-background/60 p-2.5 rounded-xl border border-border/50">
                                    {highlightMetrics(currentConvertedText)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : pointBank.length === 0 ? (
            <div className="text-center p-16 border-2 border-dashed rounded-3xl border-muted bg-muted/10 text-muted-foreground flex flex-col items-center justify-center font-mono-tech">
              <div className="p-4 bg-background rounded-full shadow-xs mb-4">
                <Save className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 font-display">Your bank is empty</h3>
              <p className="max-w-md text-xs">
                Upload your finalized domain resume to extract its points here, or generate bullets in the Laboratory.
              </p>
              <div className="flex gap-2 pt-6">
                <Button
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs font-semibold cursor-pointer text-xs"
                  onClick={openFinalResumeModal}
                >
                  <UploadCloud className="h-4 w-4 mr-2" /> Upload Finalized Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={onGoToLab}
                  className="cursor-pointer text-xs"
                >
                  Go to Laboratory
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Domain Selector & Filter Bar */}
              <div className="flex flex-col gap-4 border-b border-border/50 pb-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Set(pointBank.map((b) => getRoleLabel(b.target_role)))
                    ).map((role) => {
                      const isActive =
                        activePointBankRole === role ||
                        (activePointBankRole === "all" &&
                          Array.from(
                            new Set(pointBank.map((b) => getRoleLabel(b.target_role)))
                          )[0] === role) ||
                        getRoleLabel(activePointBankRole) === role;
                      return (
                        <button
                          key={role}
                          onClick={() => setActivePointBankRole(role)}
                          className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide capitalize transition-all cursor-pointer font-mono-tech ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-xs scale-105"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Source Sub-filters */}
                {(() => {
                  const availableRoles = Array.from(
                    new Set(pointBank.map((b) => getRoleLabel(b.target_role)))
                  );
                  const displayRole =
                    activePointBankRole === "all"
                      ? availableRoles[0] || "all"
                      : getRoleLabel(activePointBankRole);
                  const currentRoleBullets = pointBank.filter(
                    (b) => getRoleLabel(b.target_role) === displayRole
                  );
                  const totalCount = currentRoleBullets.length;
                  const finalCount = currentRoleBullets.filter(
                    (b) => b.variant_type === "finalized_resume"
                  ).length;
                  const labCount = currentRoleBullets.filter(
                    (b) => b.variant_type !== "finalized_resume"
                  ).length;

                  return (
                    <div className="flex items-center gap-2 pt-1 font-mono-tech text-xs">
                      <span className="font-semibold text-muted-foreground mr-1">
                        Filter Source:
                      </span>
                      <button
                        onClick={() => setPointBankFilter("all")}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          pointBankFilter === "all"
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        All Points ({totalCount})
                      </button>
                      <button
                        onClick={() => setPointBankFilter("finalized")}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          pointBankFilter === "finalized"
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Target className="h-3 w-3" /> Final Resume ({finalCount})
                      </button>
                      <button
                        onClick={() => setPointBankFilter("lab")}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          pointBankFilter === "lab"
                            ? "bg-primary text-primary-foreground shadow-2xs"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <Sparkles className="h-3 w-3" /> Lab Saved ({labCount})
                      </button>
                    </div>
                  );
                })()}
              </div>

              {/* Grouped point cards list */}
              {(() => {
                const availableRoles = Array.from(
                  new Set(pointBank.map((b) => getRoleLabel(b.target_role)))
                );
                const displayRole =
                  activePointBankRole === "all"
                    ? availableRoles[0] || "all"
                    : getRoleLabel(activePointBankRole);
                let roleBullets = pointBank.filter(
                  (b) => getRoleLabel(b.target_role) === displayRole
                );

                if (pointBankFilter === "finalized") {
                  roleBullets = roleBullets.filter(
                    (b) => b.variant_type === "finalized_resume"
                  );
                } else if (pointBankFilter === "lab") {
                  roleBullets = roleBullets.filter(
                    (b) => b.variant_type !== "finalized_resume"
                  );
                }

                if (roleBullets.length === 0) {
                  return (
                    <div className="text-center p-12 border border-dashed rounded-2xl text-muted-foreground font-mono-tech text-xs">
                      <p>No points match the selected filter.</p>
                    </div>
                  );
                }

                const grouped: Record<string, Record<string, typeof roleBullets>> = {};
                roleBullets.forEach((bullet) => {
                  const ach = achievements.find(
                    (a) => a.id === bullet.achievement_id
                  );
                  const section = resolveBulletSectionType(bullet, ach);
                  const parent =
                    bullet.achievements?.parent_experience ||
                    bullet.achievements?.title ||
                    ach?.parent_experience ||
                    ach?.title ||
                    "General";
                  if (!grouped[section]) grouped[section] = {};
                  if (!grouped[section][parent]) grouped[section][parent] = [];
                  grouped[section][parent].push(bullet);
                });

                return (
                  <div className="space-y-10">
                    {Object.entries(grouped)
                      .sort(
                        ([secA], [secB]) =>
                          (SECTION_ORDER[secA] || 99) - (SECTION_ORDER[secB] || 99)
                      )
                      .map(([section, parents]) => (
                        <div key={section} className="space-y-5">
                          <h3 className="text-lg font-extrabold text-foreground border-b border-primary/20 pb-2 inline-block pr-8 uppercase tracking-wider font-display">
                            {section}
                          </h3>
                          <div className="space-y-6">
                            {Object.entries(parents).map(([parent, bullets]) => {
                              const sortedBullets = [...bullets].sort((a, b) => {
                                const aIsFinal =
                                  a.variant_type === "finalized_resume" ? 1 : 0;
                                const bIsFinal =
                                  b.variant_type === "finalized_resume" ? 1 : 0;
                                return bIsFinal - aIsFinal;
                              });

                              return (
                                <div key={parent} className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-base text-foreground flex items-center gap-2 font-display">
                                      <Target className="h-4 w-4 text-primary" /> {parent}
                                    </h4>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7 text-primary hover:bg-primary/10 font-mono-tech cursor-pointer"
                                      onClick={() =>
                                        navigator.clipboard.writeText(
                                          sortedBullets
                                            .map((b) => `• ${b.bullet_text}`)
                                            .join("\n")
                                        )
                                      }
                                    >
                                      <Copy className="h-3 w-3 mr-1" /> Copy Section
                                    </Button>
                                  </div>
                                  <ul className="space-y-2.5">
                                    {sortedBullets.map((bullet) => {
                                      const isFinal =
                                        bullet.variant_type === "finalized_resume";
                                      return (
                                        <li
                                          key={bullet.id}
                                          className={`group relative rounded-2xl border transition-all overflow-hidden p-4 ${
                                            isFinal
                                              ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 hover:border-emerald-500/70"
                                              : "border-border/40 bg-card hover:bg-muted/10 hover:border-border/80"
                                          }`}
                                        >
                                          {editingPointBankBullet === bullet.id ? (
                                            <div className="space-y-3">
                                              <Textarea
                                                value={editPointBankText}
                                                onChange={(e) =>
                                                  setEditPointBankText(e.target.value)
                                                }
                                                className="min-h-[90px] w-full text-sm resize-none font-sans"
                                                autoFocus
                                              />
                                              <div className="flex justify-between items-center text-xs text-muted-foreground font-mono-tech">
                                                <span>
                                                  Length: {editPointBankText.length} chars
                                                </span>
                                                <div className="flex gap-2">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                      setEditingPointBankBullet(null)
                                                    }
                                                    className="cursor-pointer"
                                                  >
                                                    Cancel
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    onClick={() =>
                                                      onSavePointBankEdit(bullet.id)
                                                    }
                                                    className="cursor-pointer font-bold"
                                                  >
                                                    Save Edit
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="pr-20 flex gap-3.5 items-start">
                                              <div
                                                className={`mt-2 h-2 w-2 rounded-full shrink-0 ${
                                                  isFinal
                                                    ? "bg-emerald-500 ring-4 ring-emerald-500/20"
                                                    : "bg-primary/60"
                                                }`}
                                              />
                                              <div className="flex flex-col gap-1.5 w-full">
                                                <div className="flex flex-wrap items-center gap-2 mb-0.5 font-mono-tech">
                                                  {isFinal ? (
                                                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50 text-[10px] font-bold uppercase gap-1">
                                                      <Target className="h-3 w-3" /> Final Resume Point
                                                    </Badge>
                                                  ) : (
                                                    <Badge
                                                      variant="outline"
                                                      className="bg-primary/5 text-primary border-primary/20 text-[10px] font-semibold uppercase gap-1"
                                                    >
                                                      <Sparkles className="h-3 w-3" /> Lab Generated
                                                    </Badge>
                                                  )}
                                                  <span className="text-[10px] text-muted-foreground font-mono">
                                                    {bullet.bullet_text.length} chars
                                                  </span>
                                                </div>

                                                <div className="text-[14.5px] leading-relaxed text-foreground font-normal font-sans">
                                                  {highlightMetrics(bullet.bullet_text)}
                                                </div>
                                              </div>

                                              {/* Action Buttons Overlay */}
                                              <div className="absolute right-3 top-3 bottom-3 flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity font-mono-tech">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(
                                                      bullet.bullet_text
                                                    );
                                                    setCopiedBulletId(bullet.id);
                                                    setTimeout(
                                                      () => setCopiedBulletId(null),
                                                      2000
                                                    );
                                                  }}
                                                  className="h-7 w-7 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-foreground cursor-pointer"
                                                  title="Copy Bullet"
                                                >
                                                  {copiedBulletId === bullet.id ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                  ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                  )}
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    onOpenRefine({
                                                      source: "bank",
                                                      id: bullet.id,
                                                      text: bullet.bullet_text,
                                                      role: bullet.target_role,
                                                      isFinalResume: isFinal,
                                                      charLength:
                                                        bullet.bullet_text.length,
                                                    })
                                                  }
                                                  className="h-7 w-7 rounded-xl hover:bg-primary/10 text-primary cursor-pointer"
                                                  title="AI Refine"
                                                >
                                                  <Sparkles className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() => {
                                                    setEditingPointBankBullet(bullet.id);
                                                    setEditPointBankText(
                                                      bullet.bullet_text
                                                    );
                                                  }}
                                                  className="h-7 w-7 rounded-xl hover:bg-primary/10 text-muted-foreground hover:text-foreground cursor-pointer"
                                                  title="Manual Edit"
                                                >
                                                  <Edit3 className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    onDeletePointBankItem(bullet.id)
                                                  }
                                                  className="h-7 w-7 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                                                  title="Delete Point"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
