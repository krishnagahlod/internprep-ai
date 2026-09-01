"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Printer,
  X,
  Briefcase,
  BookOpen,
  Sparkles,
  DollarSign,
  Zap,
  Check,
  FileText,
  Copy,
  BrainCircuit,
  Code,
  Wrench,
  Target,
  Award,
  BarChart3,
  FileCheck,
  Users,
  PieChart,
  ChevronRight,
  HelpCircle,
  Flame,
  CheckSquare,
} from "lucide-react";
import {
  PlacementRole,
  CategorizedKeywords,
  RoleIntelligence,
  ResumeMatchResult,
  SalaryBreakdownResult,
  Company,
} from "./types";

interface PlacementDossierModalProps {
  selectedCompanySlug: string | null;
  onClose: () => void;
  loadingDetails: boolean;
  companyDetails: any;
  activeDossierTab: "roles" | "keywords" | "resumematch" | "selection" | "roadmap";
  setActiveDossierTab: (tab: "roles" | "keywords" | "resumematch" | "selection" | "roadmap") => void;
  selectedRoleIndex: number;
  setSelectedRoleIndex: (idx: number) => void;
  salaryBreakdown: SalaryBreakdownResult | null;
  fetchSalaryBreakdown: (roleId: string) => void;
  matchingResume: boolean;
  matchResult: ResumeMatchResult | null;
  handleMatchResume: (roleId: string) => void;
  copiedBulletIdx: number | null;
  handleCopyBullet: (text: string, idx: number) => void;
  copiedJd: boolean;
  setCopiedJd: (val: boolean) => void;
  isJdExpanded: boolean;
  setIsJdExpanded: (val: boolean) => void;
  handlePrintDossierPDF: () => void;
  handleLaunchMockInterview: (company: any, role?: any) => void;
  formatINRAmount: (amount: number) => string;
  formatOriginalSalary: (role: PlacementRole) => string;
}

export function PlacementDossierModal({
  selectedCompanySlug,
  onClose,
  loadingDetails,
  companyDetails,
  activeDossierTab,
  setActiveDossierTab,
  selectedRoleIndex,
  setSelectedRoleIndex,
  salaryBreakdown,
  fetchSalaryBreakdown,
  matchingResume,
  matchResult,
  handleMatchResume,
  copiedBulletIdx,
  handleCopyBullet,
  copiedJd,
  setCopiedJd,
  isJdExpanded,
  setIsJdExpanded,
  handlePrintDossierPDF,
  handleLaunchMockInterview,
  formatINRAmount,
  formatOriginalSalary,
}: PlacementDossierModalProps) {
  if (!selectedCompanySlug) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-purple-500/10 flex justify-between items-start">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30 flex items-center justify-center text-xl font-extrabold text-primary font-display shrink-0 shadow-sm font-mono-tech">
              {companyDetails?.company?.name?.substring(0, 2).toUpperCase() || "CP"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap font-mono-tech">
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground font-display">
                  {companyDetails?.company?.name || "Company Intelligence"}
                </h2>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs font-bold">
                  {companyDetails?.company?.tier_category || "C1"}
                </Badge>
                {companyDetails?.company?.difficulty_score && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold flex items-center gap-1">
                    <Target className="h-3 w-3" /> Difficulty: {companyDetails.company.difficulty_score}/10
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap font-mono-tech">
                <span>{companyDetails?.company?.primary_sector}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-sans">
                  <MapPin className="h-3 w-3" />{" "}
                  {Array.from(
                    new Set(
                      (companyDetails?.company?.locations || []).map((l: string) =>
                        l.trim()
                      )
                    )
                  )
                    .slice(0, 3)
                    .join(", ") || "Pan India"}
                </span>
                <span>•</span>
                <span>{companyDetails?.roles_count || companyDetails?.roles?.length || 0} JAF Postings</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrintDossierPDF}
              className="h-8 text-xs font-bold flex items-center gap-1.5 font-mono-tech cursor-pointer"
              title="Print or Save 2-Page Prep Sheet PDF"
            >
              <Printer className="h-3.5 w-3.5" /> Share / PDF
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dossier Tabs - 3 Student-Focused Briefing Sections */}
        <div className="px-6 border-b border-border/40 bg-muted/30 flex gap-4 overflow-x-auto font-mono-tech">
          <button
            onClick={() => setActiveDossierTab("roles")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDossierTab === "roles"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" /> JAF Roles & Job Profiles ({companyDetails?.roles_count || companyDetails?.roles?.length || 0})
          </button>
          <button
            onClick={() => setActiveDossierTab("selection")}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDossierTab === "selection"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" /> Selection Gauntlet & Senior Q&A{" "}
            {companyDetails?.selection_blueprint?.questions_asked?.length
              ? `(${companyDetails.selection_blueprint.questions_asked.length})`
              : ""}
          </button>
          <button
            onClick={() => {
              setActiveDossierTab("keywords");
              if (companyDetails?.roles?.[selectedRoleIndex] && !matchResult) {
                handleMatchResume(companyDetails.roles[selectedRoleIndex].id);
              }
            }}
            className={`py-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeDossierTab === "keywords" ||
              activeDossierTab === "resumematch" ||
              activeDossierTab === "roadmap"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" /> Skills & 1-Click Resume Fit
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[62vh] space-y-6 custom-scrollbar">
          {loadingDetails ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
              <p className="text-xs text-muted-foreground font-mono-tech">
                Synthesizing complete company intelligence...
              </p>
            </div>
          ) : activeDossierTab === "roles" ? (
            <div className="space-y-6">
              {/* Role Selector */}
              {companyDetails?.roles && companyDetails.roles.length > 1 && (
                <div>
                  <span className="text-xs font-semibold text-muted-foreground mb-2 block font-mono-tech">
                    Select Target Job Announcement Form (JAF):
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {companyDetails.roles.map((r: PlacementRole, idx: number) => (
                      <button
                        key={r.id}
                        onClick={() => {
                          setSelectedRoleIndex(idx);
                          fetchSalaryBreakdown(r.id);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left shrink-0 border transition-all cursor-pointer font-mono-tech ${
                          selectedRoleIndex === idx
                            ? "bg-primary text-primary-foreground border-primary shadow-sm scale-[1.01]"
                            : "bg-card hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        <span className="block font-bold truncate max-w-[220px]">
                          {r.job_title}
                        </span>
                        <span className="text-[10px] opacity-80 block">
                          {r.session_label} • {r.primary_sector}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {companyDetails?.roles && companyDetails.roles[selectedRoleIndex] && (
                (() => {
                  const curRole: PlacementRole = companyDetails.roles[selectedRoleIndex];
                  return (
                    <div className="space-y-6">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-primary/10 border border-primary/20 space-y-4">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider block font-mono-tech">
                              {curRole.session_label} • {curRole.category_tier} Tier • {curRole.primary_sector}
                            </span>
                            <h3 className="text-lg font-extrabold text-foreground font-display mt-0.5">
                              {curRole.job_title}
                            </h3>
                          </div>
                          <Badge variant="outline" className="bg-background text-xs font-semibold font-mono-tech">
                            {curRole.location}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border/40 font-mono-tech">
                          <div className="p-3 rounded-xl bg-card border border-border/60">
                            <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                              Original CTC ({curRole.currency})
                            </span>
                            <span className="text-base font-extrabold text-foreground">
                              {formatOriginalSalary(curRole)}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-card border border-border/60">
                            <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                              INR Converted Benchmark
                            </span>
                            <span className="text-base font-extrabold text-amber-500">
                              {formatINRAmount(curRole.compensation.ctc_inr_equivalent)}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-card border border-border/60">
                            <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                              Fixed Base Salary
                            </span>
                            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                              {curRole.compensation.inhand_median > 0
                                ? formatINRAmount(curRole.compensation.inhand_inr_equivalent)
                                : "Standard Pay"}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-card border border-border/60">
                            <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                              Currency Type
                            </span>
                            <span className="text-base font-extrabold text-purple-500">
                              {curRole.compensation.is_international
                                ? "International"
                                : "Domestic (INR)"}
                            </span>
                          </div>
                        </div>

                        {/* Compensation Structure Visualizer */}
                        {salaryBreakdown && (
                          <div className="p-4.5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider font-mono-tech">
                                  Compensation Structure: Fixed Base vs Variable vs ESOPs
                                </h4>
                              </div>
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 font-bold px-2.5 py-1 font-mono-tech">
                                Total CTC: {formatINRAmount(salaryBreakdown.ctc_inr)}
                              </Badge>
                            </div>

                            {/* Visual Composition Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                                <div
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round(
                                        (salaryBreakdown.base_pay_annual /
                                          (salaryBreakdown.ctc_inr || 1)) *
                                          100
                                      )
                                    )}%`,
                                  }}
                                  className="bg-emerald-500 h-full"
                                  title={`Fixed Base: ₹${salaryBreakdown.base_pay_annual.toLocaleString()}`}
                                />
                                <div
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round(
                                        (salaryBreakdown.variable_bonus_annual /
                                          (salaryBreakdown.ctc_inr || 1)) *
                                          100
                                      )
                                    )}%`,
                                  }}
                                  className="bg-amber-500 h-full"
                                  title={`Variable Bonus: ₹${salaryBreakdown.variable_bonus_annual.toLocaleString()}`}
                                />
                                <div
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round(
                                        (salaryBreakdown.esops_annual /
                                          (salaryBreakdown.ctc_inr || 1)) *
                                          100
                                      )
                                    )}%`,
                                  }}
                                  className="bg-purple-500 h-full"
                                  title={`ESOPs: ₹${salaryBreakdown.esops_annual.toLocaleString()}`}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-muted-foreground flex-wrap gap-2 font-mono-tech">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />{" "}
                                  Fixed Annual Base (
                                  {Math.round(
                                    (salaryBreakdown.base_pay_annual /
                                      (salaryBreakdown.ctc_inr || 1)) *
                                      100
                                  )}
                                  %)
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />{" "}
                                  Variable Bonus (
                                  {Math.round(
                                    (salaryBreakdown.variable_bonus_annual /
                                      (salaryBreakdown.ctc_inr || 1)) *
                                      100
                                  )}
                                  %)
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />{" "}
                                  ESOPs / Equity (
                                  {Math.round(
                                    (salaryBreakdown.esops_annual /
                                      (salaryBreakdown.ctc_inr || 1)) *
                                      100
                                  )}
                                  %)
                                </span>
                              </div>
                            </div>

                            {/* 4 Clean Metric Tiles */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/40 font-mono-tech">
                              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                                  Total CTC
                                </span>
                                <span className="text-sm font-extrabold text-foreground">
                                  {formatINRAmount(salaryBreakdown.ctc_inr)}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block mb-0.5">
                                  Fixed Base Component
                                </span>
                                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                  {formatINRAmount(salaryBreakdown.base_pay_annual)}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                                  Variable Bonus
                                </span>
                                <span className="text-sm font-extrabold text-amber-500">
                                  {salaryBreakdown.variable_bonus_annual > 0
                                    ? formatINRAmount(salaryBreakdown.variable_bonus_annual)
                                    : "Included in Base"}
                                </span>
                              </div>
                              <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                                <span className="text-[10px] text-muted-foreground font-semibold block mb-0.5">
                                  ESOPs / Stocks
                                </span>
                                <span className="text-sm font-extrabold text-purple-500">
                                  {salaryBreakdown.esops_annual > 0
                                    ? formatINRAmount(salaryBreakdown.esops_annual)
                                    : "No ESOPs"}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Official compensation breakdown derived from the company's Job Announcement Form (JAF), detailing guaranteed annual fixed compensation versus performance-based incentives and long-term equity.
                            </p>
                          </div>
                        )}

                        {curRole.perks_and_benefits && curRole.perks_and_benefits.length > 0 && (
                          <div className="pt-2 border-t border-border/40">
                            <span className="text-xs font-semibold text-foreground mb-1.5 block font-mono-tech">
                              Compensation Perks & Bonuses:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {curRole.perks_and_benefits.map((p, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs bg-primary/10 text-primary border-primary/20 font-mono-tech"
                                >
                                  <Zap className="h-3 w-3 mr-1" /> {p}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {curRole.additional_info_raw && (
                          <div className="text-xs text-muted-foreground bg-background/60 p-3 rounded-xl border border-border/40 italic">
                            "{curRole.additional_info_raw}"
                          </div>
                        )}
                      </div>

                      {/* Responsibilities */}
                      {curRole.responsibilities && curRole.responsibilities.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider font-mono-tech">
                            Core Responsibilities
                          </h4>
                          <ul className="space-y-1.5">
                            {curRole.responsibilities.map((r, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Official Job Announcement Form (JAF) */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono-tech">
                            <FileText className="h-4 w-4 text-primary" /> Official Job Announcement Form (JAF & Job Description)
                          </h4>
                          <div className="flex items-center gap-2">
                            {curRole.raw_jd && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(curRole.raw_jd);
                                  setCopiedJd(true);
                                  setTimeout(() => setCopiedJd(false), 2000);
                                }}
                                className="h-7 px-2.5 text-[11px] font-bold text-primary flex items-center gap-1 font-mono-tech cursor-pointer"
                              >
                                {copiedJd ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedJd ? "Copied JD!" : "Copy Full JD"}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsJdExpanded(!isJdExpanded)}
                              className="h-7 px-2.5 text-[11px] font-semibold text-muted-foreground font-mono-tech cursor-pointer"
                            >
                              {isJdExpanded ? "Collapse" : "Expand Full View"}
                            </Button>
                          </div>
                        </div>
                        <div
                          className={`p-4.5 rounded-2xl bg-muted/30 border border-border/60 text-xs text-foreground leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans custom-scrollbar transition-all ${
                            isJdExpanded ? "max-h-[600px]" : "max-h-72"
                          }`}
                        >
                          {curRole.raw_jd ||
                            curRole.role_summary ||
                            companyDetails?.company?.ai_overview ||
                            "Detailed Job Announcement Form specifications currently on file."}
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          ) : activeDossierTab === "keywords" ? (
            /* TAB 2: SKILL TAXONOMY & RESUME FIT */
            <div className="space-y-6">
              {companyDetails?.roles && companyDetails.roles[selectedRoleIndex] && (
                (() => {
                  const curRole: PlacementRole = companyDetails.roles[selectedRoleIndex];
                  const kw: CategorizedKeywords = curRole.categorized_keywords || {
                    all: curRole.required_skills || [],
                    languages: [],
                    frameworks_and_tools: [],
                    core_concepts: [],
                    leadership: [],
                  };

                  return (
                    <div className="space-y-6">
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1.5">
                        <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono-tech">
                          <BrainCircuit className="h-4 w-4 text-primary" /> Multi-Dimensional Skill Taxonomy Extraction
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Extracted directly from the official Job Announcement Form (JAF) for <strong>{curRole.job_title}</strong>.
                        </p>
                      </div>

                      {kw.languages && kw.languages.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                            <Code className="h-4 w-4 text-blue-500" /> Core Programming Languages
                          </h4>
                          <div className="flex flex-wrap gap-2 font-mono-tech">
                            {kw.languages.map((l, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold shadow-2xs"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {kw.frameworks_and_tools && kw.frameworks_and_tools.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                            <Wrench className="h-4 w-4 text-purple-500" /> Frameworks, Libraries & Developer Tools
                          </h4>
                          <div className="flex flex-wrap gap-2 font-mono-tech">
                            {kw.frameworks_and_tools.map((t, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold shadow-2xs"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {kw.core_concepts && kw.core_concepts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                            <Target className="h-4 w-4 text-amber-500" /> Domain Architecture & Methodologies
                          </h4>
                          <div className="flex flex-wrap gap-2 font-mono-tech">
                            {kw.core_concepts.map((c, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold shadow-2xs"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {kw.leadership && kw.leadership.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5 font-mono-tech">
                            <Award className="h-4 w-4 text-emerald-500" /> Leadership & Problem Solving Competencies
                          </h4>
                          <div className="flex flex-wrap gap-2 font-mono-tech">
                            {kw.leadership.map((l, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-2xs"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {curRole.intelligence?.topic_weightage && (
                        <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-3 font-mono-tech">
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <BarChart3 className="h-4 w-4 text-primary" /> Interview Topic Focus Distribution
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                              <span className="text-lg font-extrabold text-primary">
                                {curRole.intelligence.topic_weightage.dsa_and_problem_solving}%
                              </span>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">Problem Solving / DSA</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                              <span className="text-lg font-extrabold text-purple-500">
                                {curRole.intelligence.topic_weightage.system_and_domain_design}%
                              </span>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">System & Product Design</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                              <span className="text-lg font-extrabold text-amber-500">
                                {curRole.intelligence.topic_weightage.case_and_business_sense}%
                              </span>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">Business & Case Sense</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40">
                              <span className="text-lg font-extrabold text-emerald-500">
                                {curRole.intelligence.topic_weightage.resume_and_leadership_fit}%
                              </span>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">Resume & Cultural Fit</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Live Resume Compatibility & Keyword Gap */}
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex justify-between items-center flex-wrap gap-3 font-mono-tech">
                        <div>
                          <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <FileCheck className="h-4 w-4 text-primary" /> Live Resume Compatibility & Keyword Gap
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Target Role: <strong>{curRole.job_title}</strong> at {curRole.company_name}
                          </p>
                        </div>

                        <Button
                          size="sm"
                          disabled={matchingResume}
                          onClick={() => handleMatchResume(curRole.id)}
                          className="h-8 text-xs font-bold bg-primary text-primary-foreground cursor-pointer"
                        >
                          {matchingResume ? "Analyzing Resume..." : "Re-Scan My Resume"}
                        </Button>
                      </div>

                      {matchResult && (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-5 rounded-2xl bg-card border border-border/60 font-mono-tech">
                          <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-muted/40 border border-border/40">
                            <div className="relative flex items-center justify-center w-20 h-20 rounded-full border-4 border-primary/30 text-2xl font-extrabold text-primary">
                              {matchResult.match_score}%
                            </div>
                            <span className="text-xs font-bold text-foreground mt-2">
                              {matchResult.match_rating}
                            </span>
                          </div>

                          <div className="sm:col-span-8 space-y-3">
                            <div>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                                ✓ Matched Skills ({matchResult.matched_skills.length}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {matchResult.matched_skills.length > 0 ? (
                                  matchResult.matched_skills.map((s, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold"
                                    >
                                      {s}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground italic">
                                    No direct matches found in sample text.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <span className="text-xs font-bold text-destructive block mb-1">
                                ⚠ Missing High-Yield Keywords ({matchResult.missing_critical_skills.length}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {matchResult.missing_critical_skills.map((s, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-[11px] font-semibold"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {matchResult?.tailored_resume_bullets && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono-tech">
                            <Sparkles className="h-4 w-4 text-amber-500" /> AI-Generated Tailored Resume Bullets (STAR / Google X-Y-Z):
                          </h4>
                          <div className="space-y-2">
                            {matchResult.tailored_resume_bullets.map((bullet, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-2xl bg-card border border-border/60 text-xs flex justify-between items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors"
                              >
                                <span className="text-foreground leading-relaxed font-medium">
                                  {bullet}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyBullet(bullet, idx)}
                                  className="h-7 px-2 text-[11px] font-bold text-primary shrink-0 font-mono-tech cursor-pointer"
                                >
                                  {copiedBulletIdx === idx ? (
                                    "Copied!"
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" /> Copy
                                    </>
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          ) : activeDossierTab === "selection" ? (
            /* TAB 3: SELECTION GAUNTLET & SENIOR Q&A */
            <div className="space-y-6">
              <div className="p-4.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3.5 shadow-xs">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Award className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap font-mono-tech">
                    <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      {companyDetails?.selection_blueprint?.has_authentic_student_data
                        ? "Verified IITB Senior Interview Debrief"
                        : "Campus Selection Gauntlet & Evaluation Blueprint"}
                    </h4>
                    {companyDetails?.selection_blueprint?.has_authentic_student_data && (
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[10px] font-bold"
                      >
                        100% Authentic Senior Data
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {companyDetails?.selection_blueprint?.has_authentic_student_data
                      ? `Authentic selection tests and interview questions directly recorded by IIT Bombay seniors who cleared shortlists at ${companyDetails?.company?.name}.`
                      : `Domain-calibrated evaluation funnel and high-yield interview questions for ${companyDetails?.company?.primary_sector} roles.`}
                  </p>
                </div>
              </div>

              {/* Recruitment Funnel */}
              {(() => {
                const funnel =
                  companyDetails?.hiring_funnel_intelligence ||
                  companyDetails?.company?.hiring_funnel_intelligence;
                if (!funnel) return null;

                const oaCount = funnel.conversion_funnel?.oa_shortlisted_count || 0;
                const interviewCount = funnel.conversion_funnel?.interview_shortlisted_count || 0;
                const walkinCount = funnel.conversion_funnel?.walkin_extended_shortlists_count || 0;
                const convPct = funnel.conversion_funnel?.oa_to_interview_conversion_pct;
                const branches: [string, number][] = Object.entries(
                  funnel.demographics?.branch_distribution || {}
                ).slice(0, 5) as [string, number][];
                const degrees: [string, number][] = Object.entries(
                  funnel.demographics?.degree_distribution || {}
                ).slice(0, 3) as [string, number][];

                return (
                  <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap font-mono-tech">
                          <h4 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-blue-500" />
                            2025–26 Shortlist & Conversion Reality
                          </h4>
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
                            Verified Portal Data ({funnel.total_updates} Updates Logged)
                          </Badge>
                          {funnel.has_walkins && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                              Day Walk-ins Offered
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Extracted from official placement announcements, test shortlists, and interview calls for the 2025–26 season.
                        </p>
                      </div>

                      {funnel.hiring_phases && funnel.hiring_phases.length > 0 && (
                        <div className="flex gap-1 flex-wrap font-mono-tech">
                          {funnel.hiring_phases.map((ph: string, pIdx: number) => (
                            <span key={pIdx} className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md text-foreground">
                              {ph}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3-Tile Funnel Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono-tech">
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>1. Online Assessment</span>
                          <span className="text-foreground font-extrabold">{oaCount > 0 ? oaCount : "Open Pool"}</span>
                        </div>
                        <div className="text-xs font-extrabold text-foreground">
                          {funnel.online_assessment?.platform || "Standard OA Platform"}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                          <span>
                            Mode: {funnel.online_assessment?.venue ? `Venue: ${funnel.online_assessment.venue}` : (funnel.online_assessment?.mode || "Online")}
                          </span>
                          <span>Format: {funnel.online_assessment?.test_format || "Coding & Aptitude"}</span>
                          {funnel.online_assessment?.duration_minutes && (
                            <span>Duration: {funnel.online_assessment.duration_minutes} Mins</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                          <span>2. Interview Calls</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                            {interviewCount > 0 ? interviewCount : "Direct Shortlist"}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-foreground">
                          {convPct !== null && convPct !== undefined ? `${convPct}% OA Clear Rate` : "Direct Shortlist Selection"}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                          {walkinCount > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              +{walkinCount} Extended / Walk-in shortlists
                            </span>
                          ) : (
                            <span>Standard Interview Rounds</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          3. Eligibility & Slotting
                        </div>
                        <div className="text-xs font-bold text-foreground">
                          Slot: {funnel.placement_slot || companyDetails?.company?.placement_slot || "Phase 1 / Rolling"}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                          <span>CPI Cutoff: {funnel.cpi_criteria?.cutoff_stated || "None"}</span>
                          <span>Bonus JAF: {funnel.cpi_criteria?.bonus_jaf_allowed ? "Allowed" : "Not Allowed"}</span>
                          {funnel.bond_applicable !== undefined && funnel.bond_applicable !== null && (
                            <span className={funnel.bond_applicable ? "text-rose-500 font-bold" : "text-emerald-500 font-semibold"}>
                              Service Bond: {funnel.bond_applicable ? "Applicable" : "No Bond"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Department Distribution Progress Bar */}
                    {branches.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-border/50 font-mono-tech">
                        <div className="flex justify-between items-center text-[11px] flex-wrap gap-1">
                          <span className="font-extrabold text-foreground flex items-center gap-1.5">
                            <PieChart className="h-3.5 w-3.5 text-primary" />
                            Verified Branch Shortlist Breakdown
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            {degrees.map(([deg, pct]) => `${deg}: ${pct}%`).join(" • ")}
                          </span>
                        </div>

                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                          {branches.map(([branch, pct], bIdx) => {
                            const colors = ["bg-blue-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];
                            return (
                              <div
                                key={bIdx}
                                style={{ width: `${pct}%` }}
                                className={`${colors[bIdx % colors.length]} transition-all`}
                                title={`${branch}: ${pct}%`}
                              />
                            );
                          })}
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {branches.map(([branch, pct], bIdx) => (
                            <span
                              key={bIdx}
                              className="text-[10px] font-medium bg-muted/60 text-foreground px-2 py-0.5 rounded-md border border-border/40 flex items-center gap-1"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  bIdx === 0
                                    ? "bg-blue-500"
                                    : bIdx === 1
                                    ? "bg-indigo-500"
                                    : bIdx === 2
                                    ? "bg-emerald-500"
                                    : bIdx === 3
                                    ? "bg-amber-500"
                                    : "bg-purple-500"
                                }`}
                              />
                              {branch}: <strong className="font-bold">{String(pct)}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Authentic Questions Asked */}
              <div className="space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2 font-mono-tech">
                  <h3 className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-emerald-500" />
                    {companyDetails?.selection_blueprint?.has_authentic_student_data
                      ? "Actual Questions Asked in Interviews"
                      : "High-Yield Practice Questions"}
                    {companyDetails?.selection_blueprint?.questions_asked?.length
                      ? ` (${companyDetails.selection_blueprint.questions_asked.length})`
                      : ""}
                  </h3>
                  <span className="text-[11px] text-muted-foreground">Click copy icon to save any question</span>
                </div>

                {companyDetails?.selection_blueprint?.questions_asked &&
                companyDetails.selection_blueprint.questions_asked.length > 0 ? (
                  <div className="space-y-2.5">
                    {companyDetails.selection_blueprint.questions_asked.map((q: string, i: number) => {
                      const isCopied = copiedBulletIdx === 2000 + i;
                      return (
                        <div
                          key={i}
                          className="group p-3.5 rounded-2xl bg-card border border-border/70 hover:border-primary/50 text-xs flex justify-between items-start gap-3 shadow-2xs transition-all"
                        >
                          <div className="flex items-start gap-3 font-mono-tech">
                            <span className="w-6 h-6 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                              Q{i + 1}
                            </span>
                            <span className="text-foreground font-medium leading-relaxed font-sans">{q}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(q);
                              handleCopyBullet(q, 2000 + i);
                            }}
                            className="h-7 px-2 text-[11px] font-bold text-muted-foreground hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity font-mono-tech cursor-pointer"
                            title="Copy Question"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-xs text-muted-foreground italic">
                    Standard problem-solving and resume deep-dive questions reported for this profile.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* TAB 4: PREPARATION PLAYBOOK */
            <div className="space-y-6">
              {companyDetails?.roles && companyDetails.roles[selectedRoleIndex] && (
                (() => {
                  const curRole: PlacementRole = companyDetails.roles[selectedRoleIndex];
                  const intel: RoleIntelligence | undefined = curRole.intelligence;

                  return (
                    <div className="space-y-6">
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-purple-500/10 border border-primary/30 space-y-3 font-mono-tech">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                          <h3 className="text-sm font-extrabold text-foreground font-display">
                            AI Placement Preparation Playbook for {companyDetails?.company?.name} ({curRole.job_title})
                          </h3>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                          Customized high-yield revision topics and resume power points synthesized from historical JAF requirements and senior student interview experiences.
                        </p>
                      </div>

                      {intel?.key_selection_hurdle && (
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5 font-mono-tech">
                          <h4 className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Target className="h-4 w-4 text-amber-500" /> Primary Selection Hurdle
                          </h4>
                          <p className="text-xs text-foreground leading-relaxed font-medium font-sans">
                            {intel.key_selection_hurdle}
                          </p>
                        </div>
                      )}

                      {intel?.resume_power_tip && (
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5 font-mono-tech">
                          <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Flame className="h-4 w-4 text-emerald-500" /> What Winning Resumes Highlight
                          </h4>
                          <p className="text-xs text-foreground leading-relaxed font-medium font-sans">
                            {intel.resume_power_tip}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-muted-foreground text-center sm:text-left font-mono-tech">
            Ready to practice for <strong className="text-foreground">{companyDetails?.company?.name}</strong>?
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto font-mono-tech">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="w-full sm:w-auto h-10 text-xs font-semibold cursor-pointer"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() =>
                handleLaunchMockInterview(
                  companyDetails?.company,
                  companyDetails?.roles?.[selectedRoleIndex]
                )
              }
              className="w-full sm:w-auto h-10 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" /> Practice for {companyDetails?.company?.name} with AI Coach
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
