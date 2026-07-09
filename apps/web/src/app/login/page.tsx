"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"

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
          // Email confirmations are disabled in Supabase, logged in immediately
          setUser(data.user)
          router.push("/dashboard")
        } else {
          // Email confirmations are enabled
          alert("Check your email for the confirmation link! (Please check your spam folder as well)")
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
      // It will redirect away, no need to setIsLoading(false) on success
    } catch (err: any) {
      setError(err.message || "An error occurred with Google Login")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-10000" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-7000 delay-1000" />
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      
      <Button 
        variant="ghost" 
        className="absolute top-6 left-6 z-50 text-muted-foreground hover:text-foreground hidden md:flex" 
        onClick={() => router.push("/")}
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Button>

      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-background/50 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden relative z-10">
        
        {/* Left Side: Branding */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden border-r border-black/5 dark:border-white/5">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-3 bg-primary/20 rounded-2xl mb-6 shadow-inner">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">
              Master Your <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                Non-Core Prep
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Join elite IIT Bombay students using AI to perfect their resumes and ace consulting, finance, and product mock interviews.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <p className="text-sm font-medium text-foreground">Exclusive to IIT Bombay</p>
            <p className="text-xs text-muted-foreground mt-1">For Phase 1 and Phase 2 placements</p>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-8 md:p-12 relative flex flex-col justify-center">
          
          <Button variant="ghost" size="sm" className="absolute top-6 left-6 md:hidden" onClick={() => router.push("/")}>
             ← Back
          </Button>

          <div className="max-w-sm w-full mx-auto space-y-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold tracking-tight">{isLoginView ? 'Welcome back' : 'Create an account'}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoginView ? 'Enter your details to access your dashboard.' : 'Sign up to start perfecting your resume.'}
              </p>
            </div>

            {/* Custom Pill Toggle (Fixes Shadcn Tabs vertical stacking issue) */}
            <div className="flex p-1 bg-black/5 dark:bg-white/5 rounded-xl relative">
              <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${isLoginView ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsLoginView(true)}
              >
                Login
              </button>
              <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 z-10 ${!isLoginView ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsLoginView(false)}
              >
                Sign Up
              </button>
              
              {/* Sliding Background Indicator */}
              <div 
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${isLoginView ? 'translate-x-0' : 'translate-x-full'}`}
              />
            </div>

            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">IITB Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="student@iitb.ac.in" 
                    className="h-12 bg-black/5 dark:bg-white/5 border-transparent focus:bg-transparent rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                    {isLoginView && <a href="#" className="text-xs text-primary hover:underline font-medium">Forgot password?</a>}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    className="h-12 bg-black/5 dark:bg-white/5 border-transparent focus:bg-transparent rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <Button 
                  className="w-full h-12 rounded-xl font-semibold shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.4)] transition-all" 
                  onClick={() => handleAuth(isLoginView ? "login" : "signup")}
                  disabled={isLoading || !email || !password}
                >
                  {isLoading 
                    ? (isLoginView ? "Logging in..." : "Creating Account...") 
                    : (isLoginView ? "Sign In to Account" : "Create Account")
                  }
                </Button>
                
                <div className="relative w-full py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-black/10 dark:border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase font-medium">
                    <span className="bg-background px-4 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-xl bg-background border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
