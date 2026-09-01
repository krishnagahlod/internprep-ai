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
  Activity,
  ChevronRight,
  MessageSquare,
  Loader2,
  Sparkles,
  Copy,
  CheckCircle2,
  Save,
  Lightbulb,
  FileText,
} from "lucide-react";
import {
  Achievement,
  GeneratedBullet,
  getRoleLabel,
  highlightMetrics,
} from "./types";

interface ResumeLabTabProps {
  labMode: "single" | "composer";
  setLabMode: (mode: "single" | "composer") => void;
  achievements: Achievement[];
  selectedAchievement: string | null;
  setSelectedAchievement: (id: string | null) => void;
  composerHeading: string | null;
  setComposerHeading: (heading: string | null) => void;
  composerSelectedIds: string[];
  setComposerSelectedIds: (ids: string[]) => void;
  targetRole: string;
  setTargetRole: (role: string) => void;
  targetCompany: string;
  setTargetCompany: (company: string) => void;
  benchmarkText: string;
  setBenchmarkText: (text: string) => void;
  composerNumPoints: number;
  setComposerNumPoints: (num: number) => void;
  customInstructions: string;
  setCustomInstructions: (inst: string) => void;
  isGenerating: boolean;
  generateVariants: () => void;
  isComposerGenerating: boolean;
  generateSectionBullets: () => void;
  generatedBullets: GeneratedBullet[];
  singleCoachingTips: string[];
  composerResults: any;
  activeVariantSet: number;
  setActiveVariantSet: (idx: number) => void;
  customOverviewLines: Record<number, string>;
  setCustomOverviewLines: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  saveBullet: (bullet: GeneratedBullet, groupId?: string) => Promise<void>;
  onOpenRefine: (target: any) => void;
}

export function ResumeLabTab({
  labMode,
  setLabMode,
  achievements,
  selectedAchievement,
  setSelectedAchievement,
  composerHeading,
  setComposerHeading,
  composerSelectedIds,
  setComposerSelectedIds,
  targetRole,
  setTargetRole,
  targetCompany,
  setTargetCompany,
  benchmarkText,
  setBenchmarkText,
  composerNumPoints,
  setComposerNumPoints,
  customInstructions,
  setCustomInstructions,
  isGenerating,
  generateVariants,
  isComposerGenerating,
  generateSectionBullets,
  generatedBullets,
  singleCoachingTips,
  composerResults,
  activeVariantSet,
  setActiveVariantSet,
  customOverviewLines,
  setCustomOverviewLines,
  saveBullet,
  onOpenRefine,
}: ResumeLabTabProps) {
  const sectionOrder = [
    "Scholastic Achievements",
    "Professional Experience",
    "Positions of Responsibility",
    "Projects",
    "Extracurriculars",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card className="border-border/60 shadow-md bg-gradient-to-b from-background to-muted/10 rounded-3xl">
        <CardHeader className="border-b bg-muted/5 pb-6">
          <CardTitle className="text-2xl flex items-center gap-2 font-display">
            <Activity className="h-6 w-6 text-primary" /> Bullet Laboratory
          </CardTitle>
          <CardDescription className="text-base font-sans">
            Mix and match your raw achievements into perfectly crafted, role-specific bullet points tailored to golden benchmarks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          <div className="flex justify-center mb-2">
            <div className="bg-muted/50 p-1 rounded-2xl flex items-center gap-1 shadow-inner border border-border/50 font-mono-tech">
              <Button
                variant={labMode === "single" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLabMode("single")}
                className="px-6 rounded-xl font-semibold cursor-pointer"
              >
                Single Achievement
              </Button>
              <Button
                variant={labMode === "composer" ? "default" : "ghost"}
                size="sm"
                onClick={() => setLabMode("composer")}
                className="px-6 rounded-xl font-semibold cursor-pointer"
              >
                Section Composer
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3 col-span-1 md:col-span-2">
              {labMode === "single" ? (
                <>
                  <label
                    className="text-sm font-bold text-foreground flex items-center gap-2 font-mono-tech"
                    htmlFor="achievement-select"
                  >
                    Select Achievement Source
                  </label>
                  <div className="relative">
                    <select
                      id="achievement-select"
                      className="appearance-none flex h-14 w-full items-center justify-between rounded-2xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-xs hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer font-sans"
                      value={selectedAchievement || ""}
                      onChange={(e) => setSelectedAchievement(e.target.value)}
                      aria-label="Select an achievement"
                    >
                      <option value="" disabled>
                        -- Select an achievement from your vault --
                      </option>
                      {(() => {
                        const grouped = achievements.reduce((acc, ach) => {
                          const section = ach.section_type || "Experience";
                          if (!acc[section]) acc[section] = {};
                          const parent = ach.parent_experience || "Other";
                          if (!acc[section][parent]) acc[section][parent] = [];
                          acc[section][parent].push(ach);
                          return acc;
                        }, {} as Record<string, Record<string, Achievement[]>>);

                        const sorted = Object.keys(grouped).sort((a, b) => {
                          const idxA = sectionOrder.indexOf(a);
                          const idxB = sectionOrder.indexOf(b);
                          if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                          if (idxA === -1) return 1;
                          if (idxB === -1) return -1;
                          return idxA - idxB;
                        });

                        return sorted.map((section) =>
                          Object.entries(grouped[section]).map(([parent, achs]) => (
                            <optgroup
                              key={`${section}-${parent}`}
                              label={`${section} • ${parent}`}
                            >
                              {achs.map((ach) => (
                                <option key={ach.id} value={ach.id}>
                                  {ach.title}
                                </option>
                              ))}
                            </optgroup>
                          ))
                        );
                      })()}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                      <ChevronRight className="h-5 w-5 rotate-90" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label
                      className="text-sm font-bold text-foreground flex items-center gap-2 font-mono-tech"
                      htmlFor="heading-select"
                    >
                      Select Section Heading
                    </label>
                    <div className="relative">
                      <select
                        id="heading-select"
                        className="appearance-none flex h-14 w-full items-center justify-between rounded-2xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-xs hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer font-sans"
                        value={composerHeading || ""}
                        onChange={(e) => {
                          const heading = e.target.value;
                          setComposerHeading(heading);
                          const achs = achievements
                            .filter((a) => a.parent_experience === heading)
                            .map((a) => a.id);
                          setComposerSelectedIds(achs);
                        }}
                      >
                        <option value="" disabled>
                          -- Select a heading from your vault --
                        </option>
                        {Array.from(
                          new Set(
                            achievements
                              .filter((a) => a.parent_experience)
                              .map((a) => a.parent_experience)
                          )
                        ).map((heading) => (
                          <option key={heading} value={heading}>
                            {heading}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                        <ChevronRight className="h-5 w-5 rotate-90" />
                      </div>
                    </div>
                  </div>

                  {composerHeading && (
                    <div className="space-y-3 p-4 bg-muted/5 border border-border/50 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-foreground font-mono-tech">
                          Select Achievements to Include
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-mono-tech cursor-pointer"
                          onClick={() => {
                            const allIds = achievements
                              .filter((a) => a.parent_experience === composerHeading)
                              .map((a) => a.id);
                            if (composerSelectedIds.length === allIds.length) {
                              setComposerSelectedIds([]);
                            } else {
                              setComposerSelectedIds(allIds);
                            }
                          }}
                        >
                          {composerSelectedIds.length ===
                          achievements.filter(
                            (a) => a.parent_experience === composerHeading
                          ).length
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {achievements
                          .filter((a) => a.parent_experience === composerHeading)
                          .map((ach) => (
                            <label
                              key={ach.id}
                              className="flex items-start gap-3 p-3 rounded-xl border border-border/40 hover:bg-muted/20 cursor-pointer transition-colors bg-background shadow-2xs"
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                checked={composerSelectedIds.includes(ach.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setComposerSelectedIds([
                                      ...composerSelectedIds,
                                      ach.id,
                                    ]);
                                  } else {
                                    setComposerSelectedIds(
                                      composerSelectedIds.filter(
                                        (id) => id !== ach.id
                                      )
                                    );
                                  }
                                }}
                              />
                              <div>
                                <div className="font-bold text-[13px] leading-tight font-display">
                                  {ach.title}
                                </div>
                                <div className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">
                                  {ach.original_description}
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label
                className="text-sm font-bold text-foreground flex items-center gap-2 font-mono-tech"
                htmlFor="role-select"
              >
                Select Target Industry Role
              </label>
              <div className="relative">
                <select
                  id="role-select"
                  className="appearance-none flex h-14 w-full items-center justify-between rounded-2xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-xs hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all cursor-pointer font-sans"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  aria-label="Select target role"
                >
                  <option value="consult">Management Consulting</option>
                  <option value="finance">Finance / Investment Banking</option>
                  <option value="product management">Product Management</option>
                  <option value="analytics">Data & Analytics</option>
                  <option value="it-software">Software Engineering / IT</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-primary">
                  <ChevronRight className="h-5 w-5 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label
                className="text-sm font-bold text-foreground flex items-center gap-2 font-mono-tech"
                htmlFor="target-company"
              >
                Target Company (Optional)
              </label>
              <input
                id="target-company"
                placeholder="e.g. McKinsey, Google, Goldman Sachs"
                className="flex h-14 w-full rounded-2xl border border-input/60 bg-muted/5 px-4 py-2 text-[15px] font-medium shadow-xs hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/60 font-sans"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
              />
            </div>

            <div className="space-y-3 col-span-1 md:col-span-2">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label
                    className="text-sm font-bold text-foreground flex items-center gap-2 font-mono-tech"
                    htmlFor="benchmark-text"
                  >
                    Benchmark Bullet (Optional)
                  </label>
                  <Textarea
                    id="benchmark-text"
                    placeholder="Paste a point from your LaTeX template. AI will strictly match its character length."
                    className="min-h-[80px] w-full rounded-2xl border border-input/60 bg-muted/5 px-4 py-3 text-[15px] shadow-xs hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none placeholder:text-muted-foreground/60 font-sans"
                    value={benchmarkText}
                    onChange={(e) => setBenchmarkText(e.target.value)}
                  />
                </div>
                {labMode === "composer" && (
                  <div className="space-y-3">
                    <label
                      className="text-sm font-bold text-foreground flex items-center gap-2 font-mono-tech"
                      htmlFor="num-points"
                    >
                      Number of Bullets to Generate
                    </label>
                    <div className="flex items-center h-[80px] gap-4 bg-muted/5 px-4 rounded-2xl border border-input/60 shadow-xs">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 cursor-pointer"
                        onClick={() =>
                          setComposerNumPoints(Math.max(1, composerNumPoints - 1))
                        }
                      >
                        -
                      </Button>
                      <div className="text-2xl font-bold w-12 text-center text-primary font-mono-tech">
                        {composerNumPoints}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 cursor-pointer"
                        onClick={() =>
                          setComposerNumPoints(Math.min(8, composerNumPoints + 1))
                        }
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Strategic Instructions & Comments */}
            <div className="space-y-3 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-bold text-foreground flex items-center gap-2 font-mono-tech"
                  htmlFor="custom-instructions"
                >
                  <MessageSquare className="h-4 w-4 text-primary" /> Additional Instructions & Strategic Focus (Optional)
                </label>
                {customInstructions && (
                  <button
                    type="button"
                    onClick={() => setCustomInstructions("")}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline cursor-pointer font-mono-tech"
                  >
                    Clear
                  </button>
                )}
              </div>
              <Textarea
                id="custom-instructions"
                placeholder="e.g. 'Emphasize backend latency & high scale (15k TPS)', 'Highlight C-suite stakeholder alignment', 'Focus on 0-to-1 launch'..."
                className="min-h-[80px] w-full rounded-2xl border border-input/60 bg-muted/5 px-4 py-3 text-[14.5px] shadow-xs hover:bg-muted/20 hover:border-primary/40 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none placeholder:text-muted-foreground/60 font-sans"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 pt-1 font-mono-tech">
                <span className="text-xs text-muted-foreground flex items-center font-medium mr-1">
                  Quick Presets:
                </span>
                {[
                  {
                    label: "💼 Business ROI & Cost",
                    text: "Emphasize quantified financial ROI, cost optimization, and strategic business impact",
                  },
                  {
                    label: "⚡ Latency & High Scale",
                    text: "Highlight distributed systems scale, latency reduction, throughput, and system reliability",
                  },
                  {
                    label: "👥 Cross-Functional Leadership",
                    text: "Focus on leading cross-functional teams, stakeholder management, and initiative ownership",
                  },
                  {
                    label: "🚀 Massive Impact Front-Loaded",
                    text: "Front-load massive business/user metrics using inverted impact structure",
                  },
                  {
                    label: "🛠️ Highlight Tech Stack",
                    text: "Explicitly showcase key tools, modern frameworks, and architectural design choices",
                  },
                  {
                    label: "🎯 0-to-1 Launch",
                    text: "Highlight zero-to-one product/initiative execution, rapid iteration, and user adoption",
                  },
                ].map((preset, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={`cursor-pointer text-[11px] px-2.5 py-1 rounded-xl border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all select-none ${
                      customInstructions.includes(preset.text)
                        ? "bg-primary/15 border-primary text-primary font-semibold"
                        : "bg-background/80 text-foreground/80"
                    }`}
                    onClick={() => {
                      if (customInstructions === preset.text) {
                        setCustomInstructions("");
                      } else if (!customInstructions.trim()) {
                        setCustomInstructions(preset.text);
                      } else {
                        setCustomInstructions(
                          `${customInstructions.trim()}; ${preset.text}`
                        );
                      }
                    }}
                  >
                    {preset.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            {labMode === "single" ? (
              <Button
                className="w-full h-14 text-base md:text-lg font-bold shadow-lg hover:shadow-xl transition-all rounded-2xl font-mono-tech cursor-pointer"
                onClick={generateVariants}
                disabled={!selectedAchievement || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" /> Synthesizing variants using AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" /> Generate Benchmarked Variants
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full h-14 text-base md:text-lg font-bold shadow-lg hover:shadow-xl transition-all rounded-2xl font-mono-tech cursor-pointer"
                onClick={generateSectionBullets}
                disabled={composerSelectedIds.length === 0 || isComposerGenerating}
              >
                {isComposerGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-3" /> Composing section using AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-3" /> Compose Resume Section
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SINGLE ACHIEVEMENTS GENERATED BULLETS */}
      {labMode === "single" && generatedBullets.length > 0 && (
        <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <h3 className="text-xl font-bold px-2 font-display">Generated Variants</h3>
            <div className="h-px bg-border flex-1" />
          </div>

          <div className="flex flex-col gap-5">
            {generatedBullets.map((bullet, idx) => (
              <Card
                key={idx}
                className="border border-border shadow-xs hover:shadow-md transition-all bg-card overflow-hidden rounded-3xl"
              >
                <div className="p-5 md:p-7 flex flex-col">
                  {/* Top Row: Tag & Copy Button */}
                  <div className="flex justify-between items-start mb-4">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary font-bold tracking-widest text-[10px] px-3 py-1.5 uppercase border-0 font-mono-tech"
                    >
                      {bullet.variant_type.replace("_", " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium h-8 px-3 font-mono-tech cursor-pointer"
                      onClick={() =>
                        navigator.clipboard.writeText(bullet.bullet_text)
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>

                  {/* Middle: Bullet Text */}
                  <p className="text-[16px] md:text-[17px] font-medium leading-relaxed text-foreground text-left w-full font-sans">
                    {highlightMetrics(bullet.bullet_text)}
                  </p>

                  {/* Character Limit Checker */}
                  {benchmarkText && (
                    <div className="flex items-center gap-3 mt-4 w-full md:w-2/3 font-mono-tech">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            bullet.bullet_text.length > benchmarkText.length + 5
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min(
                              (bullet.bullet_text.length / benchmarkText.length) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-[12px] font-bold ${
                          bullet.bullet_text.length > benchmarkText.length + 5
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {bullet.bullet_text.length} / {benchmarkText.length} chars
                      </span>
                    </div>
                  )}

                  {/* Bottom Row: AI Coach Suggestions & Save Button */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-6 gap-4 border-t border-border/50 pt-5">
                    <div className="flex-1 w-full max-w-4xl">
                      {bullet.recruiter_notes ? (
                        <div className="rounded-2xl bg-muted/30 border border-border/50 p-3.5 font-sans">
                          <details className="group">
                            <summary className="flex items-center cursor-pointer list-none text-[13px] font-bold text-foreground/80 hover:text-primary transition-colors">
                              <Sparkles className="h-4 w-4 mr-2 text-primary" />
                              AI Coach Suggestions
                              <ChevronRight className="h-4 w-4 ml-auto transition-transform group-open:rotate-90 text-muted-foreground" />
                            </summary>
                            <p className="text-[13.5px] text-muted-foreground mt-3 leading-relaxed pl-3 border-l-2 border-primary/30">
                              {bullet.recruiter_notes}
                            </p>
                          </details>
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>

                    <div className="flex gap-2 font-mono-tech">
                      <Button
                        variant="outline"
                        className="font-medium shadow-xs border-primary/20 hover:bg-primary/5 text-primary cursor-pointer"
                        onClick={() =>
                          onOpenRefine({
                            source: "lab_single",
                            id: bullet.id,
                            text: bullet.bullet_text,
                            role: targetRole,
                          })
                        }
                      >
                        <Sparkles className="h-4 w-4 mr-2" /> Refine
                      </Button>
                      <Button
                        size="default"
                        variant={bullet.is_saved ? "secondary" : "default"}
                        className={`font-medium min-w-[120px] shadow-xs transition-all cursor-pointer ${
                          bullet.is_saved
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30"
                            : ""
                        }`}
                        onClick={() => saveBullet(bullet)}
                        disabled={bullet.is_saved}
                      >
                        {bullet.is_saved ? (
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {bullet.is_saved ? "Saved" : "Save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Single Bullet Coaching Tips */}
          {singleCoachingTips && singleCoachingTips.length > 0 && (
            <div className="p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 text-[15px] font-bold text-primary mb-3 font-display">
                <Lightbulb className="h-5 w-5" /> Proactive Coach Recommendations for this Point
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                {singleCoachingTips.map((tip, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 bg-background/80 p-3 rounded-2xl border border-primary/10 text-[13.5px] text-foreground/90"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary font-mono-tech">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION COMPOSER RESULTS */}
      {labMode === "composer" && composerResults && composerResults.variant_sets && (
        <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <h3 className="text-xl font-bold px-2 font-display">Generated Section Variants</h3>
            <div className="h-px bg-border flex-1" />
          </div>

          {composerResults.variant_sets.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 bg-muted/30 rounded-3xl border border-dashed font-mono-tech">
              <p>AI generation returned no variants. Please try again or refine your instructions.</p>
            </div>
          ) : (
            <div className="flex justify-center gap-4 flex-wrap font-mono-tech">
              {composerResults.variant_sets.map((vSet: any, idx: number) => (
                <Button
                  key={idx}
                  variant={activeVariantSet === idx ? "default" : "outline"}
                  className="flex flex-col h-auto py-3 px-6 rounded-2xl cursor-pointer"
                  onClick={() => setActiveVariantSet(idx)}
                >
                  <span className="font-bold">{vSet.set_label}</span>
                  <span className="text-xs opacity-80 font-normal max-w-xs whitespace-normal font-sans">
                    {vSet.set_description}
                  </span>
                </Button>
              ))}
            </div>
          )}

          {composerResults.variant_sets[activeVariantSet] && (
            <div className="space-y-6">
              {/* Section LaTeX Header & Italicized Overview Line Showcase */}
              <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-primary/20 shadow-md rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-border/60">
                  <div>
                    <div className="flex items-center gap-2 font-mono-tech">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/30 font-bold uppercase text-[10px] tracking-wider"
                      >
                        Section Top Line
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        IITB Placement Standard
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-foreground mt-1 flex items-center gap-2 font-display">
                      {composerHeading || "Organization / Experience Name"}{" "}
                      <span className="font-normal text-muted-foreground text-sm font-sans">
                        | {getRoleLabel(composerResults.target_role || targetRole)}
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 font-mono-tech">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-medium border-border/70 hover:bg-muted/50 rounded-xl cursor-pointer"
                      onClick={() => {
                        const overview =
                          customOverviewLines[activeVariantSet] ??
                          (composerResults.variant_sets[activeVariantSet]?.overview_line ||
                            composerResults.variant_sets[activeVariantSet]?.overview_line_variants?.[0]?.text ||
                            "");
                        navigator.clipboard.writeText(overview);
                        alert("Overview line copied to clipboard!");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Overview
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs font-medium shadow-xs rounded-xl cursor-pointer"
                      onClick={() => {
                        const currentSet = composerResults.variant_sets[activeVariantSet];
                        const heading = composerHeading || "Organization / Experience";
                        const overview =
                          customOverviewLines[activeVariantSet] ??
                          (currentSet?.overview_line ||
                            currentSet?.overview_line_variants?.[0]?.text ||
                            "");
                        const bullets = currentSet.bullets
                          .map((b: any) => `• ${b.bullet_text}`)
                          .join("\n");
                        const fullText = `${heading} | ${getRoleLabel(
                          composerResults.target_role || targetRole
                        )}\n${overview ? `${overview}\n` : ""}${bullets}`;
                        navigator.clipboard.writeText(fullText);
                        alert("Full formatted section copied to clipboard!");
                      }}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" /> Copy Full Section
                    </Button>
                  </div>
                </div>

                {/* Italicized Overview Box */}
                <div className="bg-background/90 p-4 rounded-2xl border border-primary/15 shadow-inner space-y-2 font-serif">
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-medium font-sans">
                    <span className="flex items-center gap-1.5 text-primary font-semibold">
                      <Sparkles className="h-3.5 w-3.5" /> Italicized Overview 1-Liner:
                    </span>
                    <span className="text-[11px] opacity-70">Renders directly below heading</span>
                  </div>
                  <p className="italic text-[15px] md:text-[16px] text-foreground/95 leading-relaxed pl-3 border-l-2 border-primary/60">
                    {customOverviewLines[activeVariantSet] ??
                      (composerResults.variant_sets[activeVariantSet]?.overview_line ||
                        composerResults.variant_sets[activeVariantSet]?.overview_line_variants?.[0]?.text ||
                        "No overview line generated.")}
                  </p>
                </div>

                {/* Style / Archetype Switcher Pills */}
                {composerResults.variant_sets[activeVariantSet]?.overview_line_variants &&
                  composerResults.variant_sets[activeVariantSet].overview_line_variants.length > 0 && (
                    <div className="space-y-2 pt-1 font-sans">
                      <span className="text-xs font-semibold text-muted-foreground font-mono-tech">
                        Overview Framing Archetypes:
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {composerResults.variant_sets[
                          activeVariantSet
                        ].overview_line_variants.map((v: any, vIdx: number) => {
                          const isSelected =
                            customOverviewLines[activeVariantSet] === v.text ||
                            (!customOverviewLines[activeVariantSet] &&
                              (v.text ===
                                composerResults.variant_sets[activeVariantSet]
                                  ?.overview_line ||
                                vIdx === 0));
                          return (
                            <button
                              key={vIdx}
                              type="button"
                              onClick={() =>
                                setCustomOverviewLines((prev) => ({
                                  ...prev,
                                  [activeVariantSet]: v.text,
                                }))
                              }
                              className={`text-left p-2.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-primary/15 border-primary text-primary font-semibold shadow-xs"
                                  : "bg-background/60 border-border/60 hover:border-primary/40 text-foreground/80 hover:bg-muted/20"
                              }`}
                            >
                              <div className="font-bold flex items-center justify-between mb-1 font-mono-tech">
                                <span>
                                  {v.label || v.type.replace("_", " ").toUpperCase()}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                              </div>
                              <p className="text-[11.5px] line-clamp-2 text-muted-foreground font-normal italic font-serif">
                                "{v.text}"
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>

              {/* The bullets list */}
              <div className="bg-card border border-border shadow-md rounded-3xl overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center">
                  <h4 className="font-bold text-foreground font-display">Drafted Points</h4>
                  {(() => {
                    const allSaved = composerResults.variant_sets[
                      activeVariantSet
                    ].bullets.every((b: any) => b.is_saved);
                    return (
                      <Button
                        size="sm"
                        variant={allSaved ? "secondary" : "default"}
                        className={`transition-all rounded-xl font-mono-tech cursor-pointer ${
                          allSaved
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25 border-emerald-500/30 font-medium"
                            : ""
                        }`}
                        disabled={allSaved}
                        onClick={async () => {
                          const groupId = crypto.randomUUID();
                          const bullets =
                            composerResults.variant_sets[activeVariantSet].bullets;
                          for (const bullet of bullets) {
                            if (!bullet.is_saved) {
                              await saveBullet(bullet, groupId);
                            }
                          }
                        }}
                      >
                        {allSaved ? (
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {allSaved ? "Set Saved" : "Save Set to Point Bank"}
                      </Button>
                    );
                  })()}
                </div>
                <div className="divide-y divide-border/50">
                  {composerResults.variant_sets[activeVariantSet].bullets.map(
                    (bullet: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 flex flex-col gap-3 hover:bg-muted/10 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 text-[16px] md:text-[17px] font-medium leading-relaxed text-foreground font-sans">
                            <span className="text-muted-foreground font-bold mr-2">•</span>
                            {highlightMetrics(bullet.bullet_text)}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0 font-mono-tech">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary hover:bg-primary/10 shrink-0 font-medium justify-start cursor-pointer"
                              onClick={() => {
                                onOpenRefine({
                                  source: "lab_composer",
                                  id: bullet.id,
                                  text: bullet.bullet_text,
                                  role:
                                    composerResults.target_role || "finance",
                                  composerSetIdx: activeVariantSet,
                                });
                              }}
                            >
                              <Sparkles className="h-4 w-4 mr-2" /> AI Refine
                            </Button>
                            <Button
                              variant={bullet.is_saved ? "secondary" : "ghost"}
                              size="sm"
                              className={`shrink-0 justify-start transition-all cursor-pointer ${
                                bullet.is_saved
                                  ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                              onClick={async () => {
                                const groupId = crypto.randomUUID();
                                await saveBullet(bullet, groupId);
                              }}
                              disabled={bullet.is_saved}
                            >
                              {bullet.is_saved ? (
                                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              {bullet.is_saved ? "Saved" : "Save Single"}
                            </Button>
                          </div>
                        </div>
                        <div className="pl-6 flex flex-wrap items-center justify-between gap-2 text-[13px] text-muted-foreground font-sans">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary shrink-0" />
                            <span className="italic">{bullet.merge_explanation}</span>
                          </div>
                          {benchmarkText && (
                            <div className="flex items-center gap-2 shrink-0 font-mono-tech">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    bullet.bullet_text.length >
                                    benchmarkText.length + 6
                                      ? "bg-amber-500"
                                      : "bg-primary"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      (bullet.bullet_text.length /
                                        benchmarkText.length) *
                                        100,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                              <span
                                className={`text-[11.5px] font-bold ${
                                  bullet.bullet_text.length >
                                  benchmarkText.length + 6
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {bullet.bullet_text.length} / {benchmarkText.length} chars
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Excluded achievements */}
              {composerResults.variant_sets[activeVariantSet].excluded_achievements &&
                composerResults.variant_sets[activeVariantSet].excluded_achievements.length > 0 && (
                  <div className="bg-muted/20 border border-border/50 rounded-2xl p-5">
                    <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2 font-display">
                      <Activity className="h-4 w-4 text-primary" /> Achievements Excluded from this Draft
                    </h4>
                    <div className="space-y-3 font-sans">
                      {composerResults.variant_sets[
                        activeVariantSet
                      ].excluded_achievements.map((excl: any, idx: number) => (
                        <div key={idx} className="text-[13px]">
                          <span className="font-semibold">{excl.title}: </span>
                          <span className="text-muted-foreground">{excl.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Section Local Coaching Tips */}
              {composerResults.local_coaching_tips &&
                composerResults.local_coaching_tips.length > 0 && (
                  <div className="p-5 rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 shadow-xs">
                    <div className="flex items-center gap-2 text-[15px] font-bold text-primary mb-3 font-display">
                      <Lightbulb className="h-5 w-5" /> Proactive Section Placement Tips
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                      {composerResults.local_coaching_tips.map(
                        (tip: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 bg-background/80 p-3 rounded-2xl border border-primary/10 text-[13.5px] text-foreground/90"
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary font-mono-tech">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{tip}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
