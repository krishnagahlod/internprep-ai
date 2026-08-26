"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Terminal, ArrowLeft, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [isLoginView, setIsLoginView] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { setUser } = useAuthStore()

  const handleAuth = async (action: "login" | "signup") => {
    setIsLoading(true)
    setError(null)

    try {
      let data, error;
      
      if (action === "signup") {
        const res = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        })
        data = res.data
        error = res.error
      } else {
        const res = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        data = res.data
        error = res.error
      }

      if (error) throw error

      if (action === "signup") {
        if (data.session) {
          setUser(data.user)
          router.push("/dashboard")
        } else {
          alert("Check your email for the confirmation link! (Please check spam folder)")
        }
      } else {
        setUser(data.user)
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || "An error occurred with Google Login")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex items-center justify-center p-4 transition-colors">
      
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <Button 
        variant="ghost" 
        size="sm"
        className="absolute top-4 left-4 z-50 text-muted-foreground hover:text-foreground hidden sm:flex text-xs font-mono-tech" 
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Home
      </Button>

      <div className="w-full max-w-4xl grid md:grid-cols-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden relative z-10">
        
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-muted/40 border-r border-border">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Terminal className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold font-mono-tech text-foreground">InternPrep.ai</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground leading-snug">
                The Interview Intelligence Engine for Day 1 Rounds.
              </h1>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed font-sans">
                Calibrated to McKinsey, BCG, and FAANG partner rubrics. Practice case interviews, ATS scans, and Google XYZ bullet rewrites.
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono-tech text-muted-foreground pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Instant IIT Bombay @iitb.ac.in partner verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Cerebras Llama-3.3 70B &lt; 150ms latency engine</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Permanent non-expiring credit balance</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-mono-tech text-muted-foreground">
            SECURE ENCRYPTED TLS 256-BIT AUTH
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <div className="max-w-sm w-full mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {isLoginView ? 'Sign in to your account' : 'Create an account'}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 font-sans">
                {isLoginView ? 'Enter your credentials to access your candidate workspace.' : 'Sign up to begin your placement calibration.'}
              </p>
            </div>

            {/* Toggle Switch */}
            <div className="flex p-1 bg-muted rounded-lg border border-border font-mono-tech text-xs">
              <button
                className={`flex-1 py-1.5 rounded-md transition-all ${isLoginView ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsLoginView(true)}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-1.5 rounded-md transition-all ${!isLoginView ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsLoginView(false)}
              >
                Register
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-[11px] font-mono-tech uppercase text-muted-foreground">Email address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="student@iitb.ac.in" 
                    className="h-9 rounded-md text-xs bg-background border-border"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-[11px] font-mono-tech uppercase text-muted-foreground">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="h-9 rounded-md text-xs bg-background border-border"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono-tech text-center">
                    {error}
                  </div>
                )}
              </div>
              
              <div className="space-y-2 pt-1">
                <Button 
                  className="w-full h-9 rounded-md text-xs font-semibold font-mono-tech bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 shadow-xs" 
                  onClick={() => handleAuth(isLoginView ? "login" : "signup")}
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? "Processing..." : (isLoginView ? "Sign In →" : "Create Account →")}
                </Button>
                
                <div className="relative w-full py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-mono-tech">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full h-9 rounded-md text-xs font-mono-tech border-border bg-background hover:bg-muted" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
