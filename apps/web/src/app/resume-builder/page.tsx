"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { UploadCloud, CheckCircle2, ChevronRight, Save, Trash2, Edit3, MessageSquare, Plus, Activity, RefreshCw, Send, Target, Sparkles, Loader2, FileText } from "lucide-react"

// Types
type Achievement = {
  id: string
  title: string
  parent_experience: string
  timeline: string
  original_description: string
  competency_tags: string[]
  status: string
  quantified_metrics: any
}

type GeneratedBullet = {
  id: string
  achievement_id: string
  target_role: string
  bullet_text: string
  variant_type: string
  scores: any
  is_saved: boolean
}

export default function ResumeBuilderPage() {
  const [activeTab, setActiveTab] = useState("vault")
  const { user } = useAuthStore()
  const router = useRouter()
  
  // Vault State
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [rawText, setRawText] = useState("")
  
  // Lab State
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null)
  const [targetRole, setTargetRole] = useState("consulting")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedBullets, setGeneratedBullets] = useState<GeneratedBullet[]>([])
  
  // Point Bank State
  const [pointBank, setPointBank] = useState<GeneratedBullet[]>([])
  const [strategyData, setStrategyData] = useState<any>(null)
  const [isStrategyLoading, setIsStrategyLoading] = useState(false)
  const [strategyTargetRole, setStrategyTargetRole] = useState("consulting")

  // Chat State
  const [activeChatAchievement, setActiveChatAchievement] = useState<Achievement | null>(null)
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  
  // API Base
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000"

  // Fetch initial data
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchAchievements()
    fetchPointBank()
  }, [user])

  const fetchAchievements = async () => {
    if (!user) return
    try {
      const res = await fetch(`${apiBase}/builder/achievements?user_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setAchievements(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchPointBank = async () => {
    if (!user) return
    try {
      const res = await fetch(`${apiBase}/builder/point-bank?user_id=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setPointBank(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleFileUpload = async () => {
    if (!file || !user) return
    setIsExtracting(true)
    
    const formData = new FormData()
    formData.append("file", file)
    formData.append("user_id", user.id)
    
    try {
      const res = await fetch(`${apiBase}/builder/extract/pdf`, {
        method: "POST",
        body: formData
      })
      if (res.ok) {
        await fetchAchievements()
        setFile(null)
      }
    } catch (e) {
      console.error(e)
    }
    setIsExtracting(false)
  }

  const handleTextUpload = async () => {
    if (!rawText.trim() || !user) return
    setIsExtracting(true)
    
    try {
      const res = await fetch(`${apiBase}/builder/extract/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, text: rawText })
      })
      if (res.ok) {
        await fetchAchievements()
        setRawText("")
      }
    } catch (e) {
      console.error(e)
    }
    setIsExtracting(false)
  }
  
  const generateVariants = async () => {
    if (!selectedAchievement || !user) return
    setIsGenerating(true)
    
    try {
      const res = await fetch(`${apiBase}/builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_id: selectedAchievement,
          target_role: targetRole
        })
      })
      if (res.ok) {
        const data = await res.json()
        setGeneratedBullets(data)
      }
    } catch (e) {
      console.error(e)
    }
    setIsGenerating(false)
  }
  
  const saveBullet = async (bullet: GeneratedBullet) => {
    if (!user) return
    try {
      const res = await fetch(`${apiBase}/builder/save-bullet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          achievement_id: bullet.achievement_id,
          target_role: targetRole,
          bullet_text: bullet.bullet_text,
          variant_type: bullet.variant_type,
          scores: bullet.scores
        })
      })
      if (res.ok) {
        // Mark locally as saved
        setGeneratedBullets(prev => prev.map(b => b.id === bullet.id ? {...b, is_saved: true} : b))
        fetchPointBank()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const deleteAchievement = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/achievements/${id}`, { method: "DELETE" })
      if (res.ok) {
        setAchievements(prev => prev.filter(a => a.id !== id))
        if (selectedAchievement === id) setSelectedAchievement(null)
      }
    } catch (e) {
      console.error(e)
    }
  }
  
  const deletePointBankItem = async (id: string) => {
    try {
      const res = await fetch(`${apiBase}/builder/point-bank/${id}`, { method: "DELETE" })
      if (res.ok) {
        setPointBank(prev => prev.filter(b => b.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const generateStrategy = async () => {
    if (!user) return
    setIsStrategyLoading(true)
    try {
      const res = await fetch(`${apiBase}/builder/strategy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          target_role: strategyTargetRole
        })
      })
      if (res.ok) {
        setStrategyData(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
    setIsStrategyLoading(false)
  }

  const sendChatMessage = async () => {
    if (!activeChatAchievement || !chatInput.trim() || !user) return
    
    const newMessages = [...chatMessages, { role: "user", content: chatInput }]
    setChatMessages(newMessages)
    setChatInput("")
    setIsChatLoading(true)
    
    try {
      const res = await fetch(`${apiBase}/builder/metric-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          achievement_id: activeChatAchievement.id,
          messages: newMessages
        })
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages([...newMessages, { role: "assistant", content: data.response }])
        
        // If metrics were updated, refresh achievements silently
        if (data.extracted_metrics_update && Object.keys(data.extracted_metrics_update).length > 0) {
          fetchAchievements()
        }
      }
    } catch (e) {
      console.error(e)
    }
    setIsChatLoading(false)
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-2">
            <Sparkles className="mr-2 h-4 w-4" />
            Placement Focus
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Resume Builder
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Specifically focusing on placements. Store your raw achievements once, and let our AI generate perfectly benchmarked bullet variants tailored for top-tier roles.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full space-y-8">
        <TabsList className="flex flex-col sm:flex-row w-full h-auto bg-muted/30 p-1.5 rounded-xl shadow-sm border border-border/50">
          <TabsTrigger value="vault" className="flex-1 py-3 text-sm md:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <UploadCloud className="w-4 h-4 mr-2" /> Achievement Vault
          </TabsTrigger>
          <TabsTrigger value="lab" className="flex-1 py-3 text-sm md:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <Activity className="w-4 h-4 mr-2" /> Bullet Laboratory
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex-1 py-3 text-sm md:text-base font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
            <Save className="w-4 h-4 mr-2" /> Point Bank & Strategy
          </TabsTrigger>
        </TabsList>

        {/* VAULT TAB */}
        <TabsContent value="vault" className="space-y-8 animate-in fade-in-50 duration-500">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  Extract from PDF
                </CardTitle>
                <CardDescription className="text-sm mt-2">Upload your old resume. We'll automatically parse and extract your achievements into the vault.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex flex-col gap-5">
                  <div className="relative group/input">
                    <Input 
                      type="file" 
                      accept="application/pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      aria-label="Upload PDF Resume"
                    />
                    <div className={`flex items-center justify-between border-2 border-dashed rounded-xl p-4 transition-colors ${file ? 'border-primary bg-primary/5' : 'border-border group-hover/input:border-primary/50 group-hover/input:bg-muted/30'}`}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className={`h-6 w-6 flex-shrink-0 ${file ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium truncate text-foreground/80">
                          {file ? file.name : "Click or drag PDF here to upload"}
                        </span>
                      </div>
                      {file && <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />}
                    </div>
                  </div>
                  <Button onClick={handleFileUpload} disabled={!file || isExtracting} className="w-full h-12 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5">
                    {isExtracting ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Sparkles className="h-5 w-5 mr-2"/>}
                    {isExtracting ? "Extracting achievements..." : "Auto-Extract Achievements"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border shadow-sm hover:shadow-md hover:border-primary/30 transition-all bg-card relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-bl from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm border border-primary/20">
                    <Edit3 className="h-6 w-6" />
                  </div>
                  Extract from Raw Text
                </CardTitle>
                <CardDescription className="text-sm mt-2">Paste rough project descriptions or unformatted notes to extract structured achievements.</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-5">
                <Textarea 
                  placeholder="E.g., I worked on a machine learning model to predict churn. It improved retention by 15%..." 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="h-[74px] resize-none rounded-xl border-border focus-visible:ring-primary/30 focus-visible:border-primary/50 text-[15px] p-3 shadow-sm"
                  aria-label="Raw text for extraction"
                />
                <Button onClick={handleTextUpload} disabled={!rawText.trim() || isExtracting} className="w-full h-12 text-base font-semibold shadow-sm transition-all hover:-translate-y-0.5" variant="secondary">
                  {isExtracting ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Plus className="h-5 w-5 mr-2"/>}
                  {isExtracting ? "Processing text..." : "Add to Vault manually"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                Your Vault <Badge variant="secondary" className="text-sm px-2 rounded-full">{achievements.length}</Badge>
              </h2>
            </div>
            
            {achievements.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed rounded-xl border-muted bg-muted/10 text-muted-foreground flex flex-col items-center justify-center">
                <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                  <Activity className="h-8 w-8 text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Your vault is empty</h3>
                <p>Upload a resume or paste notes above to extract your first achievement.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {achievements.map(ach => (
                  <Card key={ach.id} className="flex flex-col overflow-hidden border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
                    <CardHeader className="pb-3 bg-muted/20 border-b border-border/30 relative">
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50" onClick={() => deleteAchievement(ach.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="pr-10">
                        <CardTitle className="text-lg font-semibold leading-tight mb-1 group-hover:text-primary transition-colors">{ach.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 font-medium">
                          <span className="text-foreground/80">{ach.parent_experience}</span> 
                          <span className="text-muted-foreground/50">•</span> 
                          <span className="text-muted-foreground">{ach.timeline}</span>
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pt-4">
                      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-3 mb-5">
                        {ach.original_description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ach.competency_tags?.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px] uppercase tracking-wider font-semibold bg-primary/5 text-primary border border-primary/10">
                            {tag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex gap-3 justify-between p-4 bg-muted/10 border-t border-border/30 mt-auto">
                      <Button variant="outline" size="sm" className="flex-1 h-9 bg-background shadow-sm hover:bg-primary/5 hover:text-primary border-primary/20" onClick={() => {
                        setActiveChatAchievement(ach)
                        setChatMessages([])
                      }}>
                        <MessageSquare className="h-4 w-4 mr-2 text-primary" /> Metrics Chat
                      </Button>
                      <Button size="sm" className="flex-1 h-9 shadow-sm" onClick={() => {
                        setSelectedAchievement(ach.id);
                        setActiveTab("lab");
                      }}>
                        Go to Lab <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Chat Modal */}
          {activeChatAchievement && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-background w-full max-w-lg rounded-xl shadow-xl flex flex-col h-[80vh]">
                <div className="p-4 border-b flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">Metric Reconstruction</h3>
                    <p className="text-xs text-muted-foreground truncate">{activeChatAchievement.title}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveChatAchievement(null)}>Close</Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-muted/10">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-muted-foreground p-10 bg-background rounded-xl border shadow-sm">
                      <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold text-foreground mb-2">Metrics Discovery</h4>
                      <p className="text-sm mb-6 max-w-sm mx-auto">Start an interview with our AI consultant to uncover hidden metrics and impact in this achievement.</p>
                      <Button onClick={() => {
                        sendChatMessage() // Send empty to trigger greeting
                      }} size="lg" className="rounded-full shadow-md">
                        <Sparkles className="h-4 w-4 mr-2" /> Start Interview
                      </Button>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] rounded-2xl p-4 text-[15px] shadow-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-sm' 
                          : 'bg-background border rounded-bl-sm'
                        }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-background border rounded-2xl rounded-bl-sm p-4 text-[15px] shadow-sm flex gap-3 items-center text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> AI is thinking...
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-3 relative">
                    <Textarea 
                      value={chatInput} 
                      onChange={e => setChatInput(e.target.value)} 
                      placeholder="Type your answer here..." 
                      className="resize-none pr-14 min-h-[60px] rounded-xl focus-visible:ring-primary/30 text-[15px]"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendChatMessage()
                        }
                      }}
                    />
                    <Button 
                      onClick={sendChatMessage} 
                      disabled={isChatLoading || !chatInput.trim()}
                      className="absolute right-2 top-2 h-11 w-11 rounded-lg"
                      size="icon"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-center text-muted-foreground mt-2">Press Enter to send, Shift+Enter for new line.</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* LABORATORY TAB */}
        <TabsContent value="lab" className="space-y-8 animate-in fade-in-50 duration-500">
          <Card className="border-border/60 shadow-md bg-gradient-to-b from-background to-muted/10">
            <CardHeader className="border-b bg-muted/5 pb-6">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" /> Bullet Laboratory
              </CardTitle>
              <CardDescription className="text-base">Mix and match your raw achievements into perfectly crafted, role-specific bullet points tailored to golden benchmarks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="achievement-select">
                    Select Achievement Source
                  </label>
                  <div className="relative">
                    <select 
                      id="achievement-select"
                      className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border-2 border-input bg-background px-4 py-2 text-[15px] shadow-sm hover:border-primary/50 focus:border-primary focus:ring-0 focus:outline-none transition-colors cursor-pointer"
                      value={selectedAchievement || ""}
                      onChange={(e) => setSelectedAchievement(e.target.value)}
                      aria-label="Select an achievement"
                    >
                      <option value="" disabled>-- Select an achievement from your vault --</option>
                      {achievements.map(a => (
                        <option key={a.id} value={a.id}>{a.title} ({a.parent_experience})</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2" htmlFor="role-select">
                    Select Target Industry Role
                  </label>
                  <div className="relative">
                    <select 
                      id="role-select"
                      className="appearance-none flex h-14 w-full items-center justify-between rounded-xl border-2 border-input bg-background px-4 py-2 text-[15px] shadow-sm hover:border-primary/50 focus:border-primary focus:ring-0 focus:outline-none transition-colors cursor-pointer"
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
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  className="w-full h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all" 
                  onClick={generateVariants} 
                  disabled={!selectedAchievement || isGenerating}
                >
                  {isGenerating ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-3" /> Synthesizing variants using AI...</>
                  ) : (
                    <><Sparkles className="h-5 w-5 mr-3" /> Generate Benchmarked Variants</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {generatedBullets.length > 0 && (
            <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3">
                <div className="h-px bg-border flex-1"></div>
                <h3 className="text-xl font-bold px-2">Generated Variants</h3>
                <div className="h-px bg-border flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generatedBullets.map((bullet, idx) => (
                  <Card key={idx} className="border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col group">
                    <CardHeader className="py-4 bg-muted/20 border-b relative">
                      <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="bg-background border shadow-sm font-semibold tracking-wide text-xs px-3 py-1">
                          {bullet.variant_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="py-6 flex-1 bg-background">
                      <p className="text-[15px] leading-relaxed text-foreground/90">{bullet.bullet_text}</p>
                    </CardContent>
                    <CardFooter className="p-4 bg-muted/10 border-t flex justify-end gap-2">
                       <Button 
                          size="sm" 
                          variant={bullet.is_saved ? "secondary" : "default"}
                          className={`shadow-sm w-full sm:w-auto ${bullet.is_saved ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200' : ''}`}
                          onClick={() => saveBullet(bullet)}
                          disabled={bullet.is_saved}
                        >
                          {bullet.is_saved ? (
                            <><CheckCircle2 className="h-4 w-4 mr-2"/> Saved to Bank</>
                          ) : (
                            <><Save className="h-4 w-4 mr-2"/> Save to Point Bank</>
                          )}
                        </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* POINT BANK TAB */}
        <TabsContent value="bank" className="space-y-6 animate-in fade-in-50 duration-500">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-border/60 shadow-md">
                <CardHeader className="border-b bg-muted/5 pb-5">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Save className="h-6 w-6 text-primary" /> Point Bank
                  </CardTitle>
                  <CardDescription className="text-base">Your curated collection of saved, role-specific bullet points ready to be pasted into your resume template.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {pointBank.length === 0 ? (
                    <div className="text-center p-16 border-2 border-dashed rounded-xl border-muted bg-muted/10 text-muted-foreground flex flex-col items-center justify-center">
                      <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                        <Save className="h-8 w-8 text-primary/40" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Your bank is empty</h3>
                      <p>Go to the Laboratory to generate and save your best bullets here.</p>
                      <Button className="mt-6" variant="outline" onClick={() => setActiveTab("lab")}>Go to Laboratory</Button>
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {/* Group by target role */}
                      {Array.from(new Set(pointBank.map(b => b.target_role))).map(role => (
                        <div key={role} className="space-y-4">
                          <div className="flex items-center gap-3 border-b border-border/50 pb-3">
                            <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary capitalize font-bold tracking-wide">
                              {role} Role
                            </Badge>
                            <span className="text-sm font-medium text-muted-foreground">{pointBank.filter(b => b.target_role === role).length} bullets</span>
                          </div>
                          <ul className="space-y-4">
                            {pointBank.filter(b => b.target_role === role).map(bullet => (
                              <li key={bullet.id} className="flex gap-4 items-start group p-4 rounded-xl border border-border/40 bg-background hover:bg-muted/20 hover:border-border/80 hover:shadow-sm transition-all">
                                <div className="mt-1">
                                  <div className="h-2 w-2 rounded-full bg-primary/60"></div>
                                </div>
                                <div className="flex-1 text-[15px] leading-relaxed text-foreground/90 pr-4">
                                  {bullet.bullet_text}
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => deletePointBankItem(bullet.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-red-50 hover:text-red-600 rounded-full h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-1 space-y-6">
              <Card className="bg-gradient-to-b from-primary/5 via-background to-background border-primary/20 shadow-md sticky top-6">
                <CardHeader className="border-b border-primary/10 pb-5">
                  <CardTitle className="flex items-center gap-2 text-xl text-primary">
                    <Target className="h-6 w-6" /> Strategy Engine
                  </CardTitle>
                  <CardDescription>Analyze your vault and point bank against top-tier placement standards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-foreground" htmlFor="strategy-role-select">Target Role for Analysis</label>
                    <div className="relative">
                      <select 
                        id="strategy-role-select"
                        className="appearance-none flex h-12 w-full items-center justify-between rounded-xl border-2 border-input bg-background px-4 py-2 text-[14px] shadow-sm focus:border-primary focus:ring-0 focus:outline-none hover:border-primary/50 transition-colors cursor-pointer"
                        value={strategyTargetRole}
                        onChange={(e) => setStrategyTargetRole(e.target.value)}
                        aria-label="Select target role for strategy report"
                      >
                        <option value="consult">Management Consulting</option>
                        <option value="finance">Finance / IB</option>
                        <option value="product management">Product Management</option>
                        <option value="analytics">Data & Analytics</option>
                        <option value="it-software">Software Engineering</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full h-12 shadow-sm font-medium" onClick={generateStrategy} disabled={isStrategyLoading}>
                    {isStrategyLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2"/> : <Sparkles className="h-5 w-5 mr-2"/>}
                    Generate Strategy Report
                  </Button>
                  
                  {strategyData && (
                    <div className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
                      <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border shadow-sm">
                        <span className="text-sm font-medium text-muted-foreground mb-2">Overall Readiness</span>
                        <div className="flex items-end gap-1">
                          <span className={`text-4xl font-extrabold ${strategyData.overall_readiness_score > 70 ? "text-green-600" : strategyData.overall_readiness_score > 40 ? "text-amber-500" : "text-destructive"}`}>
                            {strategyData.overall_readiness_score}
                          </span>
                          <span className="text-muted-foreground font-medium mb-1">/100</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-md">
                          <CheckCircle2 className="h-4 w-4" /> Key Strengths
                        </h4>
                        <ul className="text-sm space-y-2 pl-2">
                          {strategyData.strengths?.map((s: string, i: number) => (
                            <li key={i} className="flex gap-2"><span className="text-green-500 font-bold">•</span><span className="text-foreground/80 leading-snug">{s}</span></li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-md">
                          <Activity className="h-4 w-4" /> Critical Gaps
                        </h4>
                        <ul className="text-sm space-y-2 pl-2">
                          {strategyData.critical_gaps?.map((g: string, i: number) => (
                            <li key={i} className="flex gap-2"><span className="text-red-500 font-bold">•</span><span className="text-foreground/80 leading-snug">{g}</span></li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-primary bg-primary/10 px-3 py-1.5 rounded-md">
                          <Target className="h-4 w-4" /> Immediate Action Plan
                        </h4>
                        <ul className="text-sm space-y-3 pl-2">
                          {strategyData.action_plan?.map((a: string, i: number) => (
                            <li key={i} className="flex gap-3 items-start">
                              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold mt-0.5">{i+1}</span>
                              <span className="text-foreground/90 leading-snug">{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  )
}
