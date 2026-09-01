"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Loader2,
  Sparkles,
  Edit3,
  Plus,
  Activity,
  ChevronRight,
  Save,
  Edit2,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { Achievement } from "./types";

interface ResumeVaultTabProps {
  achievements: Achievement[];
  vaultSectionFilter: string;
  setVaultSectionFilter: (filter: string) => void;
  file: File | null;
  setFile: (f: File | null) => void;
  pdfDocumentType: "resume" | "other";
  setPdfDocumentType: (t: "resume" | "other") => void;
  isExtractingPDF: boolean;
  handleFileUpload: () => void;
  rawText: string;
  setRawText: (t: string) => void;
  isExtractingText: boolean;
  handleTextUpload: () => void;
  extractionSuccessData: {
    count: number;
    new_count: number;
    merged_count: number;
    achievements: any[];
  } | null;
  setExtractionSuccessData: (data: any) => void;
  onQuickSave: (ach: Achievement) => void;
  onEdit: (ach: Achievement) => void;
  onDelete: (id: string) => void;
  onOpenChat: (ach: Achievement) => void;
  onGoToLab: (id: string) => void;
}

export function ResumeVaultTab({
  achievements,
  vaultSectionFilter,
  setVaultSectionFilter,
  file,
  setFile,
  pdfDocumentType,
  setPdfDocumentType,
  isExtractingPDF,
  handleFileUpload,
  rawText,
  setRawText,
  isExtractingText,
  handleTextUpload,
  extractionSuccessData,
  setExtractionSuccessData,
  onQuickSave,
  onEdit,
  onDelete,
  onOpenChat,
  onGoToLab,
}: ResumeVaultTabProps) {
  const sectionOrder = [
    "Scholastic Achievements",
    "Professional Experience",
    "Positions of Responsibility",
    "Projects",
    "Extracurriculars",
  ];

  const groupedAchievements = achievements.reduce((acc, ach) => {
    const section = ach.section_type || "Experience";
    if (!acc[section]) acc[section] = {};

    const parent = ach.parent_experience || "Other";
    if (!acc[section][parent]) acc[section][parent] = [];

    acc[section][parent].push(ach);
    return acc;
  }, {} as Record<string, Record<string, Achievement[]>>);

  const sortedSections = Object.keys(groupedAchievements)
    .sort((a, b) => {
      const indexA = sectionOrder.indexOf(a);
      const indexB = sectionOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
    .filter((s) => vaultSectionFilter === "all" || s === vaultSectionFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {extractionSuccessData && (
        <Alert className="bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-2xl relative shadow-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div className="ml-2">
            <AlertTitle className="font-bold">Extraction Successful!</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              Extracted {extractionSuccessData.count} total items (
              {extractionSuccessData.new_count} newly added,{" "}
              {extractionSuccessData.merged_count} existing).
            </AlertDescription>
          </div>
          <button
            onClick={() => setExtractionSuccessData(null)}
            className="absolute top-3 right-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </Alert>
      )}

      {/* TWO INPUT CARDS */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border shadow-xs hover:shadow-md hover:border-primary/30 transition-all bg-card relative overflow-hidden group rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl font-display">
              <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-xs border border-primary/20">
                <UploadCloud className="h-6 w-6" />
              </div>
              Extract from PDF
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Upload your old resume. We'll automatically parse and extract your achievements into the vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex flex-col gap-5">
              <div className="flex bg-muted/50 p-1 rounded-xl">
                <button
                  className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                    pdfDocumentType === "resume"
                      ? "bg-background shadow-xs text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setPdfDocumentType("resume")}
                >
                  Old Resume
                </button>
                <button
                  className={`flex-1 text-sm py-2 px-3 rounded-lg font-medium transition-all cursor-pointer ${
                    pdfDocumentType === "other"
                      ? "bg-background shadow-xs text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setPdfDocumentType("other")}
                >
                  Other Document
                </button>
              </div>
              {pdfDocumentType === "other" && (
                <div className="text-[12.5px] text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-xl flex items-start gap-2.5">
                  <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Supported: College transcripts, project reports, internship presentations, completion certificates, GitHub READMEs, etc.
                  </p>
                </div>
              )}

              <div className="relative group/input">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Upload PDF Document"
                />
                <div
                  className={`flex items-center justify-between border-2 border-dashed rounded-2xl p-4 transition-colors ${
                    file
                      ? "border-primary bg-primary/5"
                      : "border-border group-hover/input:border-primary/50 group-hover/input:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileText
                      className={`h-6 w-6 shrink-0 ${
                        file ? "text-primary" : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium truncate text-foreground/80 font-mono-tech">
                      {file ? file.name : "Click or drag PDF here to upload"}
                    </span>
                  </div>
                  {file && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                </div>
              </div>
              <Button
                onClick={handleFileUpload}
                disabled={!file || isExtractingPDF}
                className="w-full h-12 text-base font-semibold shadow-xs transition-all hover:-translate-y-0.5 font-mono-tech cursor-pointer"
              >
                {isExtractingPDF ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-5 w-5 mr-2" />
                )}
                {isExtractingPDF
                  ? "Extracting achievements..."
                  : "Auto-Extract Achievements"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-xs hover:shadow-md hover:border-primary/30 transition-all bg-card relative overflow-hidden group rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl font-display">
              <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-xs border border-primary/20">
                <Edit3 className="h-6 w-6" />
              </div>
              Extract from Raw Text
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              Paste rough project descriptions or unformatted notes to extract structured achievements.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-5">
            <Textarea
              placeholder="E.g., I worked on a machine learning model to predict churn. It improved retention by 15%..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="h-[74px] resize-none rounded-2xl border-border focus-visible:ring-primary/30 focus-visible:border-primary/50 text-[15px] p-3 shadow-xs bg-background font-sans"
              aria-label="Raw text for extraction"
            />
            <Button
              onClick={handleTextUpload}
              disabled={!rawText.trim() || isExtractingText}
              className="w-full h-12 text-base font-semibold shadow-xs transition-all hover:-translate-y-0.5 font-mono-tech cursor-pointer"
              variant="secondary"
            >
              {isExtractingText ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              {isExtractingText ? "Extracting text..." : "Add to Vault manually"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* VAULT ACHIEVEMENTS DISPLAY */}
      <div className="pt-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 font-display">
              <span>Your Vault Achievements</span>
              <Badge variant="secondary" className="text-xs font-mono-tech px-2 rounded-full">
                {achievements.length}
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono-tech">
              Structured raw career accomplishments categorized for AI bullet generation
            </p>
          </div>

          {achievements.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border text-xs font-mono-tech">
              {[
                { id: "all", label: "All Sections" },
                { id: "Professional Experience", label: "Experience" },
                { id: "Projects", label: "Projects" },
                { id: "Positions of Responsibility", label: "POR" },
                { id: "Scholastic Achievements", label: "Scholastic" },
                { id: "Extracurriculars", label: "Extracurriculars" },
              ].map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setVaultSectionFilter(sec.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    vaultSectionFilter === sec.id
                      ? "bg-background text-foreground font-semibold shadow-2xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {achievements.length === 0 ? (
          <div className="text-center p-16 border-2 border-dashed rounded-3xl border-muted bg-muted/10 text-muted-foreground flex flex-col items-center justify-center">
            <div className="p-4 bg-background rounded-full shadow-xs mb-4">
              <Activity className="h-8 w-8 text-primary/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 font-display">Your vault is empty</h3>
            <p className="text-xs font-mono-tech">Upload a resume or paste notes above to extract your first achievement.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedSections.length === 0 ? (
              <div className="text-center p-12 border border-dashed rounded-3xl text-muted-foreground bg-muted/5 font-mono-tech">
                <p className="text-sm">
                  No achievements found under <span className="font-semibold text-foreground">{vaultSectionFilter}</span>.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVaultSectionFilter("all")}
                  className="mt-3 text-xs cursor-pointer"
                >
                  View All Sections
                </Button>
              </div>
            ) : (
              sortedSections.map((section) => (
                <div
                  key={section}
                  className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in"
                >
                  <h3 className="text-xl font-bold text-foreground border-b border-border/50 pb-2 flex items-center gap-2 font-display">
                    <div className="w-2 h-6 bg-primary rounded-full" />
                    {section}
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(groupedAchievements[section]).map(
                      ([parent, achs]) => (
                        <details
                          key={parent}
                          className="group border border-border/50 rounded-2xl bg-card shadow-xs overflow-hidden [&_summary::-webkit-details-marker]:hidden"
                          open
                        >
                          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors select-none">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shadow-2xs font-display">
                                {parent.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-bold text-base text-foreground leading-tight font-display">
                                  {parent}
                                </h4>
                                <p className="text-xs text-muted-foreground font-mono-tech">
                                  {achs.length} achievement{achs.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              <ChevronRight className="w-5 h-5 group-open:rotate-90 transition-transform duration-300" />
                            </div>
                          </summary>
                          <div className="p-4 pt-0 border-t border-border/30 bg-muted/5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                              {achs.map((ach) => (
                                <Card
                                  key={ach.id}
                                  className="flex flex-col overflow-hidden border-border/50 shadow-2xs hover:shadow-md hover:border-primary/30 transition-all duration-200 group/card bg-background rounded-2xl"
                                >
                                  <CardHeader className="pb-3 bg-muted/20 border-b border-border/30 relative">
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-background/50 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none p-1 rounded-md">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onQuickSave(ach);
                                        }}
                                        title="Quick Save to Point Bank"
                                      >
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEdit(ach);
                                        }}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDelete(ach.id);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="pr-20">
                                      <CardTitle className="text-base font-bold leading-tight mb-1 group-hover:text-primary transition-colors font-display">
                                        {ach.title}
                                      </CardTitle>
                                      <CardDescription className="flex items-center gap-2 font-mono-tech text-xs">
                                        <span>{ach.timeline || "N/A"}</span>
                                      </CardDescription>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="flex-1 pt-4 space-y-3">
                                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-sans">
                                      {ach.original_description}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 font-mono-tech">
                                      {ach.competency_tags?.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="secondary"
                                          className="text-[10px] uppercase tracking-wider font-semibold bg-primary/5 text-primary border border-primary/10"
                                        >
                                          {tag.replace(/_/g, " ")}
                                        </Badge>
                                      ))}
                                    </div>
                                  </CardContent>
                                  <CardFooter className="pt-0 flex gap-3 justify-between p-3.5 bg-muted/10 border-t border-border/30 mt-auto font-mono-tech">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-8 text-xs bg-background shadow-2xs hover:bg-primary/5 hover:text-primary border-primary/20 cursor-pointer"
                                      onClick={() => onOpenChat(ach)}
                                    >
                                      <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-primary" /> Metrics Chat
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="flex-1 h-8 text-xs shadow-2xs cursor-pointer"
                                      onClick={() => onGoToLab(ach.id)}
                                    >
                                      Go to Lab <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                    </Button>
                                  </CardFooter>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </details>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
