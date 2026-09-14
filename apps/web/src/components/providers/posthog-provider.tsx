'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize in browser environment and if key is present
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const consent = localStorage.getItem("internprep_cookie_consent")
      const isGranted = consent === "granted"

      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // Handled manually with consent
        opt_out_capturing_by_default: !isGranted,
      })

      // Dynamic listener for user updating cookie consent
      const handleConsentUpdate = () => {
        const updated = localStorage.getItem("internprep_cookie_consent")
        if (updated === "granted") {
          posthog.opt_in_capturing()
        } else {
          posthog.opt_out_capturing()
        }
      }

      window.addEventListener("cookie_consent_updated", handleConsentUpdate)
      return () => {
        window.removeEventListener("cookie_consent_updated", handleConsentUpdate)
      }
    }
    
    // Silently ping the backend to wake it up from Render free-tier sleep
    if (typeof window !== 'undefined') {
      fetch(process.env.NEXT_PUBLIC_API_URL || '/api/proxy').catch(() => {})
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PHProvider>
  )
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const consent = localStorage.getItem("internprep_cookie_consent")
    if (consent !== "granted") return // Strictly honor user consent choices

    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }
      posthog.capture('$pageview', {
        $current_url: url,
      })
    }
  }, [pathname, searchParams])

  return null
}
