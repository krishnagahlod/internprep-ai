"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Achievement } from "./types";

interface ResumeEditAchievementModalProps {
  achievement: Achievement | null;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onChange: (updated: Achievement) => void;
}

export function ResumeEditAchievementModal({
  achievement,
  onClose,
  onSave,
  onChange,
}: ResumeEditAchievementModalProps) {
  if (!achievement) return null;

  return (
    <Dialog open={!!achievement} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSave}>
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Edit Vault Achievement</DialogTitle>
            <DialogDescription>
              Update the core context or tags for this achievement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title / Role</Label>
              <Input
                id="edit-title"
                value={achievement.title}
                onChange={(e) =>
                  onChange({ ...achievement, title: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-section">Section Category</Label>
                <select
                  id="edit-section"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={achievement.section_type || "Professional Experience"}
                  onChange={(e) =>
                    onChange({ ...achievement, section_type: e.target.value })
                  }
                >
                  <option value="Scholastic Achievements">Scholastic Achievements</option>
                  <option value="Professional Experience">Professional Experience</option>
                  <option value="Positions of Responsibility">Positions of Responsibility</option>
                  <option value="Projects">Projects</option>
                  <option value="Extracurriculars">Extracurriculars</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-parent">Organization / Heading</Label>
                <Input
                  id="edit-parent"
                  value={achievement.parent_experience || ""}
                  onChange={(e) =>
                    onChange({
                      ...achievement,
                      parent_experience: e.target.value,
                    })
                  }
                  placeholder="e.g. Google, IIT Bombay"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-timeline">Timeline / Duration</Label>
              <Input
                id="edit-timeline"
                value={achievement.timeline || ""}
                onChange={(e) =>
                  onChange({ ...achievement, timeline: e.target.value })
                }
                placeholder="e.g. May 2023 - July 2023"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-desc">Raw Accomplishment Text</Label>
              <Textarea
                id="edit-desc"
                rows={4}
                value={achievement.original_description}
                onChange={(e) =>
                  onChange({
                    ...achievement,
                    original_description: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-tags">Competency Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={(achievement.competency_tags || []).join(", ")}
                onChange={(e) =>
                  onChange({
                    ...achievement,
                    competency_tags: e.target.value
                      .split(",")
                      .map((t) => t.trim().replace(/\s+/g, "_"))
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
