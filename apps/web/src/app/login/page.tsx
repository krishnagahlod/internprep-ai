"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import { Terminal, ArrowLeft, CheckCircle2 } from "lucide-react"

function LoginContent() {
  const [isLoginView, setIsLoginView] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [acceptedConsent, setAcceptedConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") || "/dashboard"
  const supabase = createClient()
  const { setUser } = useAuthStore()

  const handleAuth = async (action: "login" | "signup") => {
    if (action === "signup" && !acceptedConsent) {
      setError("Please agree to the Terms of Service and Privacy Policy to create an account.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let data, error;
      
      if (action === "signup") {
        const res = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
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
          router.push(redirectUrl)
        } else {
          alert("Check your email for the confirmation link! (Please check spam folder)")
        }
      } else {
        setUser(data.user)
        router.push(redirectUrl)
      }
    } catch (err: any) {
      if (action === "login") {
        setError("Invalid email or password. Please check your credentials and try again.")
      } else {
        setError(err.message || "An error occurred during account creation. Please try again.")
      }
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
          redirectTo: `${location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
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
        className="absolute top-4 left-4 z-50 text-muted-foreground hover:text-foreground flex items-center text-xs font-mono-tech" 
        onClick={() => router.push("/")}
      >
        <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Home
      </Button>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="border border-border bg-card rounded-xl shadow-lg overflow-hidden backdrop-blur-sm">
          
          {/* Header Bar */}
          <div className="bg-muted px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono-tech font-bold tracking-wider text-foreground">
                AUTH_GATEWAY // IITB
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
              <span className="text-[10px] font-mono-tech text-muted-foreground">ONLINE</span>
            </div>
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold tracking-tight text-foreground font-display">
                {isLoginView ? "Sign In to CaseForge" : "Create Account"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 font-sans">
                {isLoginView 
                  ? "Access your saved interview sessions, rubrics & resume audits" 
                  : "Start preparing with AI placement-calibrated interview simulations"}
              </p>
            </div>

            {/* Segmented Switcher */}
            <div className="grid grid-cols-2 p-1 bg-muted rounded-lg border border-border mb-5 font-mono-tech text-xs">
              <button
                type="button"
                className={`py-1.5 rounded-md font-medium transition-all ${
                  isLoginView 
                    ? "bg-card text-foreground shadow-xs font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => { setIsLoginView(true); setError(null); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`py-1.5 rounded-md font-medium transition-all ${
                  !isLoginView 
                    ? "bg-card text-foreground shadow-xs font-bold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => { setIsLoginView(false); setError(null); }}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono-tech">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono-tech text-foreground">Email</Label>
                <Input 
                  type="email" 
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md border-border bg-background text-xs h-9 text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono-tech text-foreground">Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && email && password && !isLoading) {
                      handleAuth(isLoginView ? "login" : "signup");
                    }
                  }}
                  className="rounded-md border-border bg-background text-xs h-9 text-foreground placeholder:text-muted-foreground"
                />
                {!isLoginView && (
                  <div className="space-y-2 pt-1">
                    <p className="text-[10px] text-muted-foreground font-mono-tech">
                      Minimum 6 characters.
                    </p>
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms-consent"
                        checked={acceptedConsent}
                        onChange={(e) => setAcceptedConsent(e.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                      />
                      <label htmlFor="terms-consent" className="text-[11px] text-muted-foreground leading-tight select-none cursor-pointer">
                        I agree to the{" "}
                        <a href="/terms" target="_blank" className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="/privacy" target="_blank" className="text-emerald-600 dark:text-emerald-400 underline hover:text-emerald-500">
                          Privacy Policy
                        </a>
                        , and consent to digital processing under the DPDP Act.
                      </label>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 pt-1">
                <Button 
                  className="w-full h-9 rounded-md text-xs font-semibold font-mono-tech bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-zinc-950 shadow-xs" 
                  onClick={() => handleAuth(isLoginView ? "login" : "signup")}
                  disabled={isLoading || !email || !password || (!isLoginView && !acceptedConsent)}
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

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const { setGuestMode } = useAuthStore.getState()
                      setGuestMode()
                      router.push(redirectUrl)
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-mono-tech underline underline-offset-4 transition-colors py-1.5 px-2"
                  >
                    Skip for now • Continue as Guest →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center font-mono-tech text-xs text-muted-foreground">
        INITIALIZING AUTH GATEWAY...
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
