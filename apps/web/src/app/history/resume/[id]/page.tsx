"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldAlert, Target, 
  Brain, Download, Printer, Share2, Sparkles, FileText, ArrowRight 
} from "lucide-react";
import Link from "next/link";

// Helper SVG Radar Chart
const RadarChart = ({ scores }: { scores: any }) => {
  if (!scores) return null;
  const metrics = [
    { label: "Quantification", value: scores.quantification || 88 },
    { label: "Action Verbs", value: scores.action_verbs || 85 },
    { label: "Structure", value: scores.structure || 92 },
    { label: "Section Balance", value: scores.section_balance || 90 },
    { label: "STAR Compliance", value: scores.star_compliance || 94 },
    { label: "Formatting", value: scores.formatting || 100 }
  ];
  
  const size = 220;
  const center = size / 2;
  const radius = size * 0.38;
  const angleSlice = (Math.PI * 2) / metrics.length;
  
  const getCoordinates = (value: number, i: number) => {
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angleSlice * i - Math.PI / 2);
    const y = center + r * Math.sin(angleSlice * i - Math.PI / 2);
    return { x, y };
  };

  const points = metrics.map((m, i) => {
    const { x, y } = getCoordinates(m.value, i);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Web Polygons */}
        {[0.2, 0.4, 0.6, 0.8, 1].map((factor, idx) => (
          <polygon 
            key={idx}
            points={metrics.map((_, i) => {
              const {x, y} = getCoordinates(factor * 100, i);
              return `${x},${y}`;
            }).join(" ")}
            fill="none" 
            stroke="currentColor" 
            className="text-border"
          />
        ))}
        {/* Axes */}
        {metrics.map((_, i) => {
          const { x, y } = getCoordinates(100, i);
          return <line key={`axis-${i}`} x1={center} y1={center} x2={x} y2={y} stroke="currentColor" className="text-border/60" />
        })}
        {/* Data polygon */}
        <polygon points={points} fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={2} className="text-emerald-500" />
        {/* Dots */}
        {metrics.map((m, i) => {
          const { x, y } = getCoordinates(m.value, i);
          return <circle key={`dot-${i}`} cx={x} cy={y} r={3.5} fill="currentColor" className="text-emerald-500" />
        })}
      </svg>
      <div className="grid grid-cols-3 gap-2 mt-4 text-center text-[11px] font-mono-tech text-muted-foreground w-full">
        {metrics.map((m, i) => (
          <div key={i} className="p-1.5 rounded bg-muted/40 border border-border/50">
            <span className="block font-bold text-foreground">{m.value}%</span>
            <span className="truncate block">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ResumeHistoryDetail() {
  const { user, isGuest } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [resumeData, setResumeData] = useState<any>(null);

  useEffect(() => {
    if (isGuest || !user) {
      // Fallback demo data if guest or demo id
      setResumeData({
        id: params.id,
        created_at: new Date().toISOString(),
        target_role: "Management Consulting",
        analysis_data: {
          overall_feedback: "This resume demonstrates high competitive strength for Tier-1 placements. Professional experience bullets are well-quantified. Recommendations: enhance verb strength in project descriptions.",
          day1_comparison: "Candidate ranks in top 8% of Day 1 IIT Bombay benchmarks. Formatting is 100% compliant with standard single-column campus formats.",
          radar_scores: {
            quantification: 92,
            action_verbs: 86,
            structure: 94,
            section_balance: 90,
            star_compliance: 96,
            formatting: 100
          },
          radar_scores_reasoning: "Strong metric density across internships ($420k ARR, 18% accuracy lift). Minor action verb passivity in team lead bullet.",
          bullets: [
            {
              original_bullet: "Worked on machine learning model to predict customer churn for retail client.",
              critique: "Passive action verb 'worked on', missing scale and financial business metrics.",
              suggested_rewrite: "Engineered an XGBoost churn prediction model across 2.4M customer records, reducing false positives by 18% and retaining $420k in ARR.",
              severity: "major",
              section_type: "Work Experience"
            },
            {
              original_bullet: "Led consulting team for market entry project in South East Asia.",
              critique: "Vague scope, lacks quantitative outcome and methodology specifics.",
              suggested_rewrite: "Directed a 5-member team conducting MECE market sizing for $80M SEA fintech entry; delivered 3-phase go-to-market strategy approved by C-suite.",
              severity: "major",
              section_type: "Leadership"
            }
          ]
        }
      });
      setIsLoading(false);
      return;
    }

    const fetchResume = async () => {
      try {
        const { data, error } = await supabase
          .from("resume_analyses")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) throw error;
        setResumeData(data);
      } catch (err) {
        console.error("Failed to fetch resume:", err);
        router.push("/history");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchResume();
    }
  }, [user, isGuest, router, params.id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background font-mono-tech text-xs text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <p>FETCHING DIAGNOSTIC SCORECARD...</p>
        </div>
      </div>
    );
  }

  if (!resumeData) return null;

  const analysis = resumeData.analysis_data;

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden transition-colors print:bg-white print:text-black">
      
      {/* Top Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 print:hidden">
        <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/history")} 
              className="text-muted-foreground hover:text-foreground h-8 px-2.5 text-xs font-mono-tech"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> History Archives
            </Button>
            <span className="text-border">/</span>
            <span className="text-xs font-mono-tech text-emerald-600 dark:text-emerald-400 font-semibold">
              DIAGNOSTIC SCORECARD
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="h-8 px-3 text-xs font-mono-tech border-border"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Export PDF
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10 space-y-8">
        
        {/* Meta Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono-tech uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold">
                [AUDIT SCORECARD]
              </span>
              <span className="text-xs font-mono-tech text-muted-foreground">VECTOR BENCHMARK</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Resume Diagnostic Analysis
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
              Scanned on {new Date(resumeData.created_at).toLocaleDateString()} for <span className="font-semibold text-foreground">{resumeData.target_role || "General Placement"}</span>.
            </p>
          </div>

          <Link href="/resume">
            <Button size="sm" className="h-9 px-4 text-xs font-mono-tech bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs">
              Audit New Draft <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column: Radar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border text-xs font-mono-tech">
                <span className="text-foreground font-bold flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  COMPETENCE RADAR
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">DAY 1 STANDARD</span>
              </div>

              <RadarChart scores={analysis?.radar_scores} />

              {analysis?.radar_scores_reasoning && (
                <div className="p-3.5 bg-muted/40 rounded-lg border border-border text-xs font-sans text-muted-foreground space-y-1">
                  <div className="font-mono-tech font-semibold text-foreground flex items-center gap-1">
                    <Brain className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> AI Evaluation Reasoning
                  </div>
                  <p className="leading-relaxed">{analysis.radar_scores_reasoning}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Overall Feedback & Bullet-by-Bullet Diffs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overall Feedback Card */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-foreground font-mono-tech">
                Overall Placement Feedback
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-sans">
                {analysis?.overall_feedback}
              </p>

              {analysis?.day1_comparison && (
                <div className="p-3.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono-tech space-y-1">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" /> DAY 1 BENCHMARK COMPARISON
                  </div>
                  <p className="text-foreground font-sans">{analysis.day1_comparison}</p>
                </div>
              )}
            </div>

            {/* Bullet-by-Bullet Analysis */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground font-mono-tech">
                  Line-by-Line Google XYZ Rewrites
                </h3>
                <span className="text-xs font-mono-tech text-muted-foreground">
                  {analysis?.bullets?.length || 2} Bullets Evaluated
                </span>
              </div>

              {analysis?.bullets?.map((bullet: any, idx: number) => {
                return (
                  <div 
                    key={idx} 
                    className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs font-mono-tech">
                      <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold border border-border">
                        {bullet.section_type || "Experience"}
                      </span>
                      <span className="text-red-500 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" /> Weak Action Flagged
                      </span>
                    </div>

                    {/* Original Draft */}
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs font-sans text-foreground">
                      <span className="text-[10px] font-mono-tech text-red-600 dark:text-red-400 block mb-1 font-bold">
                        RAW DRAFT:
                      </span>
                      "{bullet.original_bullet}"
                    </div>

                    <p className="text-xs text-muted-foreground font-sans">
                      [CRITIQUE] {bullet.critique}
                    </p>

                    {/* Golden Rewrite */}
                    {bullet.suggested_rewrite && (
                      <div className="p-3.5 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 text-xs font-sans">
                        <span className="text-[10px] font-mono-tech text-emerald-600 dark:text-emerald-400 block mb-1 font-bold">
                          GOLDEN REWRITE (GOOGLE XYZ PASS):
                        </span>
                        <p className="font-medium text-foreground">"{bullet.suggested_rewrite}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
