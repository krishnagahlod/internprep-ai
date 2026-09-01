"use client";

import { Button } from "@/components/ui/button";
import {
  BookmarkCheck,
  Bookmark,
  Trash2,
  Edit3,
  ChevronRight,
} from "lucide-react";
import {
  CRMCompanyItem,
  CRMMilestone,
  MILESTONE_CONFIG,
} from "./types";

interface PlacementCRMViewProps {
  crmItems: CRMCompanyItem[];
  filteredCrmItems: CRMCompanyItem[];
  crmFilterMilestone: string;
  setCrmFilterMilestone: (val: string) => void;
  editingNotesSlug: string | null;
  setEditingNotesSlug: (slug: string | null) => void;
  tempNotes: string;
  setTempNotes: (val: string) => void;
  onSelectCompany: (slug: string) => void;
  onUpdateMilestone: (slug: string, milestone: CRMMilestone) => void;
  onSaveNotes: (slug: string) => void;
  onDeleteCRMItem: (slug: string) => void;
  onGoToDirectory: () => void;
  formatINRAmount: (amount: number) => string;
}

export function PlacementCRMView({
  crmItems,
  filteredCrmItems,
  crmFilterMilestone,
  setCrmFilterMilestone,
  editingNotesSlug,
  setEditingNotesSlug,
  tempNotes,
  setTempNotes,
  onSelectCompany,
  onUpdateMilestone,
  onSaveNotes,
  onDeleteCRMItem,
  onGoToDirectory,
  formatINRAmount,
}: PlacementCRMViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-6 rounded-3xl bg-card border border-border/70 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-foreground font-display flex items-center gap-2">
              <BookmarkCheck className="h-6 w-6 text-primary" /> My Target Companies & Application Pipeline
            </h2>
            <p className="text-xs text-muted-foreground mt-1 font-mono-tech">
              Manage your bookmarked campus target list, recruitment milestones, and private prep notes.
            </p>
          </div>

          {/* Milestone Filter Chips */}
          <div className="flex flex-wrap gap-1.5 font-mono-tech">
            <button
              onClick={() => setCrmFilterMilestone("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                crmFilterMilestone === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              All ({crmItems.length})
            </button>
            {(Object.keys(MILESTONE_CONFIG) as CRMMilestone[]).map((m) => {
              const count = crmItems.filter((x) => x.milestone === m).length;
              const conf = MILESTONE_CONFIG[m];
              return (
                <button
                  key={m}
                  onClick={() => setCrmFilterMilestone(m)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1 cursor-pointer ${
                    crmFilterMilestone === m
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  <span>{conf.icon}</span> {conf.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {crmItems.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border/80 p-8 space-y-3">
            <Bookmark className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
            <h3 className="text-base font-bold text-foreground">
              No companies bookmarked yet
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed font-mono-tech">
              Browse the <strong>Company Directory</strong> and click the <strong>Bookmark Icon (🔖)</strong> on any company card to build your personalized placement shortlist!
            </p>
            <Button
              size="sm"
              onClick={onGoToDirectory}
              className="text-xs font-bold font-mono-tech cursor-pointer"
            >
              Explore Directory
            </Button>
          </div>
        ) : filteredCrmItems.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground font-mono-tech">
            No companies found in this specific milestone.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredCrmItems.map((item) => {
              const isEditing = editingNotesSlug === item.slug;

              return (
                <div
                  key={item.slug}
                  className="rounded-3xl border border-border/70 bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3
                          onClick={() => onSelectCompany(item.slug)}
                          className="font-extrabold text-base text-foreground font-display hover:text-primary cursor-pointer transition-colors"
                        >
                          {item.company_name}
                        </h3>
                        <span className="text-xs text-muted-foreground font-medium font-mono-tech">
                          {item.sector} • {formatINRAmount(item.highest_ctc_inr)}
                        </span>
                      </div>

                      <button
                        onClick={() => onDeleteCRMItem(item.slug)}
                        className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                        title="Remove from Shortlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Milestone Stage Switcher */}
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1 font-mono-tech">
                        Current Recruitment Milestone:
                      </span>
                      <select
                        value={item.milestone}
                        onChange={(e) =>
                          onUpdateMilestone(item.slug, e.target.value as CRMMilestone)
                        }
                        className="w-full h-8 px-2.5 text-xs font-bold rounded-xl bg-muted/60 border border-border/60 text-foreground outline-none focus:border-primary cursor-pointer font-mono-tech"
                      >
                        <option value="interested">📌 Interested / Researching</option>
                        <option value="jaf_filled">📝 JAF Filled</option>
                        <option value="oa_submitted">⚡ OA / Test / Assignment Submitted</option>
                        <option value="interview_shortlisted">🎯 Interview Shortlist Received</option>
                        <option value="offer_received">🏆 Offer Received</option>
                      </select>
                    </div>

                    {/* Private Notes */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center font-mono-tech">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Prep Notes:
                        </span>
                        {!isEditing && (
                          <button
                            onClick={() => {
                              setEditingNotesSlug(item.slug);
                              setTempNotes(item.notes || "");
                            }}
                            className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="h-2.5 w-2.5" /> Edit Notes
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempNotes}
                            onChange={(e) => setTempNotes(e.target.value)}
                            placeholder="e.g. Talked to senior, revise Graph DP & multithreading..."
                            className="w-full h-20 p-2.5 text-xs rounded-xl bg-background border border-primary text-foreground outline-none resize-none font-sans"
                          />
                          <div className="flex justify-end gap-1.5 font-mono-tech">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNotesSlug(null)}
                              className="h-6 text-[10px] cursor-pointer"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => onSaveNotes(item.slug)}
                              className="h-6 text-[10px] font-bold cursor-pointer"
                            >
                              Save Notes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40 min-h-[44px] leading-relaxed italic font-sans">
                          {item.notes ||
                            "No private notes added yet. Click 'Edit Notes' to jot down senior tips & reminders."}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectCompany(item.slug)}
                    className="w-full h-8 text-xs font-semibold mt-2 font-mono-tech cursor-pointer"
                  >
                    Open Dossier <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
