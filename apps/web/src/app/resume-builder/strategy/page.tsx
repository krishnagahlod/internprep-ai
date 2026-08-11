"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Target, ArrowLeft, Loader2, Sparkles, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

// Recharts for competency radar
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts"

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

const getRoleLabel = (r: string) => {
  switch (r) {
    case "consulting": return "Management Consulting"
    case "finance": return "Finance"
    case "product_management": return "Product Management"
    case "analytics": return "Data Science & Analytics"
    case "software": return "Software Engineering"
    default: return r
  }
}

function StrategyPageContent() {
  const { user } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get("role") || "consulting"
  
  const [targetRole, setTargetRole] = useState(initialRole)
  const [dataSource, setDataSource] = useState("both") // "point_bank", "vault", "both"
  const [targetCompany, setTargetCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [strategyData, setStrategyData] = useState<any>(null)

  const generateStrategy = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const res = await fetch(`${apiBase}/builder/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          target_role: targetRole,
          data_source: dataSource,
          target_company: targetCompany || undefined,
          job_description: jobDescription || undefined
        })
      })
      if (res.ok) {
        setStrategyData(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefine = (point_id: string, instruction: string, section?: string) => {
    // Navigate back to the resume builder and trigger the refine modal
    // We can use query params to trigger the modal open
    const url = new URL("/resume-builder", window.location.origin)
    url.searchParams.set("tab", "bank")
    url.searchParams.set("refine", point_id)
    url.searchParams.set("instruction", encodeURIComponent(instruction))
    if (section) {
      url.searchParams.set("section", section)
    }
    router.push(url.toString())
  }

  if (!user) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => router.push("/resume-builder?tab=bank")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Builder
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" /> Resume Strategy Engine
          </h1>
          <p className="text-muted-foreground">Analyze your points against top-tier senior placement standards.</p>
        </div>
      </div>

      {!strategyData ? (
        <Card className="max-w-2xl mx-auto shadow-sm border-primary/20 bg-gradient-to-b from-background to-muted/20">
          <CardHeader>
            <CardTitle>Configure Strategy Run</CardTitle>
            <CardDescription>Select the domain and data source to generate your personalized playbook.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Target Domain</label>
              <Select value={targetRole} onValueChange={(val) => val && setTargetRole(val)}>
                <SelectTrigger className="h-12 border-input/60">
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

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Data Source to Analyze</label>
              <Select value={dataSource} onValueChange={(val) => val && setDataSource(val)}>
                <SelectTrigger className="h-12 border-input/60">
                  <SelectValue placeholder="Select data source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="point_bank">Point Bank (Only Saved Bullets)</SelectItem>
                  <SelectItem value="vault">Achievement Vault (Raw Data)</SelectItem>
                  <SelectItem value="both">Both (Comprehensive Analysis)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground" htmlFor="strategy-company">Target Company (Optional)</label>
              <Input 
                id="strategy-company"
                placeholder="e.g. McKinsey, Google, Goldman Sachs"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="h-12 border-input/60 bg-muted/5 shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground" htmlFor="strategy-jd">Job Description Snippet (Optional)</label>
              <Textarea 
                id="strategy-jd"
                placeholder="Paste key responsibilities or requirements here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[100px] border-input/60 bg-muted/5 shadow-sm resize-none"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full h-12 shadow-sm font-medium" onClick={generateStrategy} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Sparkles className="h-5 w-5 mr-2"/>}
              {isLoading ? "Analyzing 88+ Benchmark Resumes..." : "Generate Strategy Report"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* Header Score Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 border-primary/20 shadow-sm flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/5 to-background text-center">
              <span className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Overall Readiness</span>
              <div className="flex items-end gap-1 justify-center">
                <span className={`text-6xl font-extrabold ${strategyData.overall_readiness_score > 70 ? "text-green-600" : strategyData.overall_readiness_score > 40 ? "text-amber-500" : "text-destructive"}`}>
                  {strategyData.overall_readiness_score}
                </span>
                <span className="text-muted-foreground font-medium mb-2">/100</span>
              </div>
              <p className="text-sm mt-4 text-foreground/80 leading-relaxed font-medium">
                {strategyData.overall_guidance}
              </p>
            </Card>

            {/* Competency Radar */}
            <Card className="col-span-1 md:col-span-2 shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Competency Coverage vs. Domain Ideal
                </CardTitle>
                <CardDescription>How your profile maps to the {getRoleLabel(strategyData.domain)} requirements</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-1/2 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                      strategyData.competency_coverage?.map((c: any) => ({
                        subject: c.theme.replace(/_/g, " ").replace(/\b\w/g, (l:string) => l.toUpperCase()),
                        A: Math.round(c.user_coverage * 100),
                        B: Math.round(c.domain_weight * 100),
                        fullMark: 100,
                      })) || []
                    }>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{fill: "var(--foreground)", fontSize: 10}} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Your Profile" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.6} />
                      <Radar name="Domain Ideal" dataKey="B" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-4">
                  {strategyData.competency_coverage?.map((c: any, i: number) => (
                    <div key={i} className="text-sm">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold capitalize">{c.theme.replace(/_/g, " ")}</span>
                        <Badge variant={c.user_coverage >= c.domain_weight - 0.05 ? "default" : "secondary"} className="text-[10px]">
                          {Math.round(c.user_coverage * 100)}% / {Math.round(c.domain_weight * 100)}%
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{c.gap_assessment}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phrasing Alerts */}
          {strategyData.phrasing_alerts && strategyData.phrasing_alerts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Phrasing & Structural Alerts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {strategyData.phrasing_alerts.map((alert: any, i: number) => (
                  <Card key={i} className="border-amber-500/30 bg-amber-500/5 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 uppercase text-[10px]">
                          {alert.issue.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{alert.detail}</p>
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="w-full text-xs h-8"
                        onClick={() => handleRefine(alert.point_id, alert.refine_instruction)}
                      >
                        <Sparkles className="h-3 w-3 mr-1" /> Fix with AI Refine
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Section Analysis */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" /> Section-by-Section Playbook
            </h3>
            
            <div className="space-y-6">
              {strategyData.section_analysis?.map((section: any, i: number) => (
                <Card key={i} className="shadow-sm overflow-hidden">
                  <div className={`h-1.5 w-full ${section.priority_level === 'critical' ? 'bg-destructive' : section.priority_level === 'high' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <CardHeader className="pb-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">{section.section}</CardTitle>
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-bold">
                        Priority: {section.priority_level}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm font-medium text-foreground/80 bg-background/50 p-3 rounded-md border mt-2">
                      {section.domain_guidance}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {section.user_points && section.user_points.length > 0 ? (
                      <div className="divide-y">
                        {section.user_points.map((pt: any, j: number) => (
                          <div key={j} className="p-4 md:p-5 flex flex-col md:flex-row gap-4 items-start hover:bg-muted/10 transition-colors">
                            <div className="md:w-[100px] shrink-0 mt-1">
                              {pt.verdict === 'keep' ? (
                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-300 w-full justify-center">
                                  <CheckCircle2 className="h-3 w-3 mr-1" /> Keep
                                </Badge>
                              ) : pt.verdict === 'cut' ? (
                                <Badge variant="destructive" className="w-full justify-center">
                                  <AlertCircle className="h-3 w-3 mr-1" /> Cut
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 w-full justify-center">
                                  <RefreshCw className="h-3 w-3 mr-1" /> Rework
                                </Badge>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <p className="text-sm leading-relaxed">{pt.bullet_text}</p>
                              <p className="text-xs text-muted-foreground bg-muted/40 p-2 rounded-md">
                                <span className="font-semibold text-foreground">Reasoning:</span> {pt.reasoning}
                              </p>
                            </div>
                            {pt.verdict === 'needs_rework' && pt.refine_instruction && (
                              <div className="shrink-0 w-full md:w-auto">
                                <Button size="sm" variant="outline" className="w-full whitespace-nowrap" onClick={() => handleRefine(pt.point_id, pt.refine_instruction, section.section)}>
                                  <Sparkles className="h-3 w-3 mr-2" /> Fix with AI
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-sm text-muted-foreground">
                        No points found in this section.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div className="flex justify-center pt-8 pb-12">
            <Button variant="outline" size="lg" onClick={() => setStrategyData(null)} className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Run Strategy Again
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StrategyPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <StrategyPageContent />
    </Suspense>
  )
}
