"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Target,
  Loader2,
  Sparkles,
  Compass,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { getRoleLabel } from "./types";

interface ResumeStrategyModalProps {
  open: boolean;
  onClose: () => void;
  strategyData: any;
  setStrategyData: (data: any) => void;
  strategyTargetRole: string;
  setStrategyTargetRole: (val: string) => void;
  strategyDataSource: string;
  setStrategyDataSource: (val: string) => void;
  strategyTargetCompany: string;
  setStrategyTargetCompany: (val: string) => void;
  strategyJobDescription: string;
  setStrategyJobDescription: (val: string) => void;
  isStrategyLoading: boolean;
  onGenerateStrategy: () => void;
  onStrategyRefine: (pointId: string, instruction: string) => void;
}

export function ResumeStrategyModal({
  open,
  onClose,
  strategyData,
  setStrategyData,
  strategyTargetRole,
  setStrategyTargetRole,
  strategyDataSource,
  setStrategyDataSource,
  strategyTargetCompany,
  setStrategyTargetCompany,
  strategyJobDescription,
  setStrategyJobDescription,
  isStrategyLoading,
  onGenerateStrategy,
  onStrategyRefine,
}: ResumeStrategyModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="container py-4 space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 font-display">
                <Target className="h-7 w-7 text-primary" /> Resume Strategy Engine
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono-tech">
                Analyze your points against top-tier senior placement standards.
              </p>
            </div>
            {strategyData && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStrategyData(null)}
                className="text-xs font-mono-tech cursor-pointer"
              >
                Re-Configure Analysis
              </Button>
            )}
          </div>

          {!strategyData ? (
            <Card className="max-w-2xl mx-auto shadow-xs border-primary/20 bg-gradient-to-b from-background to-muted/20 rounded-3xl">
              <CardHeader>
                <CardTitle className="font-display">Configure Strategy Run</CardTitle>
                <CardDescription className="text-xs font-mono-tech">
                  Select the domain and data source to generate your personalized playbook.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 font-mono-tech">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Target Domain
                  </label>
                  <Select
                    value={strategyTargetRole}
                    onValueChange={(val) => val && setStrategyTargetRole(val)}
                  >
                    <SelectTrigger className="h-11 border-input/60 rounded-xl">
                      <SelectValue placeholder="Select target role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consulting">Management Consulting</SelectItem>
                      <SelectItem value="finance">Finance (IB/PE/VC)</SelectItem>
                      <SelectItem value="product_management">Product Management</SelectItem>
                      <SelectItem value="analytics">Data Science & Analytics</SelectItem>
                      <SelectItem value="software">Software Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Data Source to Analyze
                  </label>
                  <Select
                    value={strategyDataSource}
                    onValueChange={(val) => val && setStrategyDataSource(val)}
                  >
                    <SelectTrigger className="h-11 border-input/60 rounded-xl">
                      <SelectValue placeholder="Select data source..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="point_bank">Point Bank (Only Saved Bullets)</SelectItem>
                      <SelectItem value="vault">Achievement Vault (Raw Data)</SelectItem>
                      <SelectItem value="both">Both (Comprehensive Analysis)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground" htmlFor="strategy-company">
                    Target Company (Optional)
                  </label>
                  <Input
                    id="strategy-company"
                    placeholder="e.g. McKinsey, Google, Goldman Sachs"
                    value={strategyTargetCompany}
                    onChange={(e) => setStrategyTargetCompany(e.target.value)}
                    className="h-11 border-input/60 bg-card rounded-xl text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground" htmlFor="strategy-jd">
                    Job Description Snippet (Optional)
                  </label>
                  <Textarea
                    id="strategy-jd"
                    placeholder="Paste key responsibilities or requirements here..."
                    value={strategyJobDescription}
                    onChange={(e) => setStrategyJobDescription(e.target.value)}
                    className="min-h-[100px] border-input/60 bg-card rounded-xl text-xs resize-none font-sans"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full h-12 shadow-xs font-bold font-mono-tech rounded-2xl cursor-pointer"
                  onClick={onGenerateStrategy}
                  disabled={isStrategyLoading}
                >
                  {isStrategyLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-5 w-5 mr-2" />
                  )}
                  {isStrategyLoading
                    ? "Analyzing 88+ Benchmark Resumes..."
                    : "Generate Strategy Report"}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {/* Header Score & Radar Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 border-primary/20 shadow-xs flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-background text-center rounded-3xl">
                  <span className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider font-mono-tech">
                    Overall Readiness
                  </span>
                  <div className="flex items-end gap-1 justify-center">
                    <span
                      className={`text-6xl font-extrabold font-display ${
                        strategyData.overall_readiness_score > 70
                          ? "text-emerald-600 dark:text-emerald-400"
                          : strategyData.overall_readiness_score > 40
                          ? "text-amber-500"
                          : "text-destructive"
                      }`}
                    >
                      {strategyData.overall_readiness_score}
                    </span>
                    <span className="text-muted-foreground font-medium mb-2 font-mono-tech">
                      /100
                    </span>
                  </div>
                  <p className="text-xs mt-4 text-foreground/80 leading-relaxed font-medium">
                    {strategyData.overall_guidance}
                  </p>
                </Card>

                {/* Competency Radar */}
                <Card className="col-span-1 md:col-span-2 shadow-xs border-border/50 rounded-3xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 font-display">
                      <Target className="h-4 w-4 text-primary" /> Competency Coverage vs. Domain Ideal
                    </CardTitle>
                    <CardDescription className="text-xs font-mono-tech">
                      How your profile maps to the {getRoleLabel(strategyData.domain)} requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-1/2 h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart
                          cx="50%"
                          cy="50%"
                          outerRadius="70%"
                          data={
                            strategyData.competency_coverage?.map((c: any) => ({
                              subject: c.theme
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
                              A: Math.round(c.user_coverage * 100),
                              B: Math.round(c.domain_weight * 100),
                              fullMark: 100,
                            })) || []
                          }
                        >
                          <PolarGrid />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fill: "var(--foreground)", fontSize: 10 }}
                          />
                          <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={false}
                            axisLine={false}
                          />
                          <Radar
                            name="Your Profile"
                            dataKey="A"
                            stroke="var(--primary)"
                            fill="var(--primary)"
                            fillOpacity={0.6}
                          />
                          <Radar
                            name="Domain Ideal"
                            dataKey="B"
                            stroke="#94a3b8"
                            fill="#cbd5e1"
                            fillOpacity={0.3}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 space-y-3 font-mono-tech">
                      {strategyData.competency_coverage?.map((c: any, i: number) => (
                        <div key={i} className="text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold capitalize">
                              {c.theme.replace(/_/g, " ")}
                            </span>
                            <Badge
                              variant={
                                c.user_coverage >= c.domain_weight - 0.05
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {Math.round(c.user_coverage * 100)}% /{" "}
                              {Math.round(c.domain_weight * 100)}%
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-[11px] font-sans">
                            {c.gap_assessment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Global Coaching Roadmap */}
              {strategyData.global_coaching_roadmap &&
                strategyData.global_coaching_roadmap.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 font-display">
                      <Compass className="h-5 w-5 text-primary" /> Prioritized Next-Step Action Roadmap
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-tech">
                      {strategyData.global_coaching_roadmap.map((item: any, i: number) => (
                        <Card
                          key={i}
                          className="border-border/60 shadow-xs bg-gradient-to-b from-card to-muted/20 hover:border-primary/40 transition-all flex flex-col justify-between rounded-2xl"
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between mb-1">
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase font-bold text-primary border-primary/30"
                              >
                                Step {item.step_number || i + 1}
                              </Badge>
                              <Badge
                                variant={
                                  item.priority === "critical"
                                    ? "destructive"
                                    : item.priority === "high"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-[10px] uppercase font-bold"
                              >
                                {item.priority}
                              </Badge>
                            </div>
                            <CardTitle className="text-sm leading-snug font-display">
                              {item.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                              {item.description}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

              {/* Phrasing Alerts */}
              {strategyData.phrasing_alerts && strategyData.phrasing_alerts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 font-display">
                    <AlertTriangle className="h-5 w-5 text-amber-500" /> Phrasing & Structural Alerts
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strategyData.phrasing_alerts.map((alert: any, i: number) => (
                      <Card
                        key={i}
                        className="border-amber-500/30 bg-amber-500/5 shadow-xs rounded-2xl"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 uppercase text-[10px] font-mono-tech font-bold"
                            >
                              {alert.issue.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-foreground">
                            {alert.detail}
                          </p>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full text-xs h-8 font-mono-tech cursor-pointer"
                            onClick={() => {
                              onClose();
                              onStrategyRefine(alert.point_id, alert.refine_instruction);
                            }}
                          >
                            <Sparkles className="h-3 w-3 mr-1 text-primary" /> Fix with AI Refine
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
