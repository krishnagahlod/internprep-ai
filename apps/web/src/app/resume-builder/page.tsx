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
import { UploadCloud, CheckCircle2, ChevronRight, Save, Trash2, Edit3, MessageSquare, Plus, Activity, RefreshCw, Send, Target, Sparkles } from "lucide-react"

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
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Placement Resume Builder</h1>
          <p className="text-muted-foreground mt-2">
            Store your raw achievements once. Generate perfect bullets for any role.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="vault">1. Achievement Vault</TabsTrigger>
          <TabsTrigger value="lab">2. Bullet Laboratory</TabsTrigger>
          <TabsTrigger value="bank">3. Point Bank & Strategy</TabsTrigger>
        </TabsList>

        {/* VAULT TAB */}
        <TabsContent value="vault" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Extract from PDF Resume</CardTitle>
                <CardDescription>Upload an old resume to auto-extract achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input 
                    type="file" 
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleFileUpload} disabled={!file || isExtracting}>
                    {isExtracting ? <RefreshCw className="h-4 w-4 animate-spin mr-2"/> : <UploadCloud className="h-4 w-4 mr-2"/>}
                    Extract
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Extract from Raw Text</CardTitle>
                <CardDescription>Paste project descriptions or notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Paste raw project notes here..." 
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="h-20"
                />
                <Button onClick={handleTextUpload} disabled={!rawText.trim() || isExtracting} className="w-full">
                  {isExtracting ? <RefreshCw className="h-4 w-4 animate-spin mr-2"/> : <Plus className="h-4 w-4 mr-2"/>}
                  Extract from Text
                </Button>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Achievements ({achievements.length})</h2>
            {achievements.length === 0 ? (
              <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
                No achievements yet. Upload a resume or paste notes to begin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map(ach => (
                  <Card key={ach.id} className="flex flex-col">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{ach.title}</CardTitle>
                        <Badge variant={ach.status === 'accepted' ? "default" : "secondary"}>
                          {ach.status}
                        </Badge>
                      </div>
                      <CardDescription>{ach.parent_experience} • {ach.timeline}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {ach.original_description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {ach.competency_tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag.replace(/_/g, ' ')}</Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 flex gap-2 justify-between border-t p-4 mt-auto">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => deleteAchievement(ach.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setActiveChatAchievement(ach)
                          setChatMessages([])
                        }}>
                          <MessageSquare className="h-4 w-4 mr-2" /> Metrics Chat
                        </Button>
                      </div>
                      <Button size="sm" onClick={() => {
                        setSelectedAchievement(ach.id);
                        setActiveTab("lab");
                      }}>
                        Lab <ChevronRight className="h-4 w-4 ml-1" />
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
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-muted-foreground p-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>Start a chat to help quantify this achievement.</p>
                      <Button className="mt-4" onClick={() => {
                        sendChatMessage() // Send empty to trigger greeting
                      }}>Start Interview</Button>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 text-sm flex gap-2 items-center">
                        <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t flex gap-2">
                  <Input 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    placeholder="Type your answer..." 
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                  />
                  <Button onClick={sendChatMessage} disabled={isChatLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* LABORATORY TAB */}
        <TabsContent value="lab" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bullet Laboratory</CardTitle>
              <CardDescription>Select an achievement and target role to generate tailored bullet variants based on placement golden benchmarks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Achievement</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedAchievement || ""}
                    onChange={(e) => setSelectedAchievement(e.target.value)}
                  >
                    <option value="" disabled>-- Select Achievement --</option>
                    {achievements.map(a => (
                      <option key={a.id} value={a.id}>{a.title} ({a.parent_experience})</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Role</label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                  >
                    <option value="consult">Consulting</option>
                    <option value="finance">Finance</option>
                    <option value="product management">Product Management</option>
                    <option value="analytics">Analytics</option>
                    <option value="it-software">IT / Software</option>
                  </select>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={generateVariants} 
                disabled={!selectedAchievement || isGenerating}
              >
                {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
                Generate Benchmarked Variants
              </Button>
            </CardContent>
          </Card>

          {generatedBullets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Generated Variants</h3>
              <div className="grid grid-cols-1 gap-4">
                {generatedBullets.map((bullet, idx) => (
                  <Card key={idx} className="border-primary/20">
                    <CardHeader className="py-3 bg-muted/30">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-background">
                          {bullet.variant_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant={bullet.is_saved ? "secondary" : "default"}
                          onClick={() => saveBullet(bullet)}
                          disabled={bullet.is_saved}
                        >
                          {bullet.is_saved ? <CheckCircle2 className="h-4 w-4 mr-2"/> : <Save className="h-4 w-4 mr-2"/>}
                          {bullet.is_saved ? "Saved to Bank" : "Save Bullet"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-4">
                      <p className="text-base">{bullet.bullet_text}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* POINT BANK TAB */}
        <TabsContent value="bank" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Point Bank</CardTitle>
                  <CardDescription>Your saved, role-specific bullet points. Copy these into your final resume template.</CardDescription>
                </CardHeader>
                <CardContent>
                  {pointBank.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                      No saved bullets yet. Go to the Laboratory to generate and save some!
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Group by target role */}
                      {Array.from(new Set(pointBank.map(b => b.target_role))).map(role => (
                        <div key={role} className="space-y-4">
                          <h3 className="text-lg font-bold capitalize border-b pb-2">{role}</h3>
                          <ul className="space-y-3">
                            {pointBank.filter(b => b.target_role === role).map(bullet => (
                              <li key={bullet.id} className="flex gap-4 items-start group">
                                <div className="flex-1 bg-muted/30 p-3 rounded-md text-sm group-hover:bg-muted/50 transition-colors">
                                  {bullet.bullet_text}
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => deletePointBankItem(bullet.id)} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <Trash2 className="h-4 w-4 text-red-500" />
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
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" /> Strategy Engine
                  </CardTitle>
                  <CardDescription>Analyze your vault and bank for a specific role.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={strategyTargetRole}
                    onChange={(e) => setStrategyTargetRole(e.target.value)}
                  >
                    <option value="consult">Consulting</option>
                    <option value="finance">Finance</option>
                    <option value="product management">Product Management</option>
                    <option value="analytics">Analytics</option>
                    <option value="it-software">IT / Software</option>
                  </select>
                  <Button className="w-full" onClick={generateStrategy} disabled={isStrategyLoading}>
                    {isStrategyLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2"/> : <Sparkles className="h-4 w-4 mr-2"/>}
                    Generate Strategy
                  </Button>
                  
                  {strategyData && (
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-semibold">Readiness Score</span>
                        <Badge variant={strategyData.overall_readiness_score > 70 ? "default" : "destructive"}>
                          {strategyData.overall_readiness_score}/100
                        </Badge>
                      </div>
                      
                      <div>
                        <span className="text-sm font-semibold text-green-600 block mb-1">Strengths</span>
                        <ul className="text-xs space-y-1 pl-4 list-disc">
                          {strategyData.strengths?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                      
                      <div>
                        <span className="text-sm font-semibold text-red-600 block mb-1">Critical Gaps</span>
                        <ul className="text-xs space-y-1 pl-4 list-disc">
                          {strategyData.critical_gaps?.map((g: string, i: number) => <li key={i}>{g}</li>)}
                        </ul>
                      </div>
                      
                      <div>
                        <span className="text-sm font-semibold block mb-1">Action Plan</span>
                        <ul className="text-xs space-y-1 pl-4 list-decimal">
                          {strategyData.action_plan?.map((a: string, i: number) => <li key={i}>{a}</li>)}
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
