import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import supabase from './lib/supabase'
import useUserStore from './stores/userStore'
import useOpportunityStore from './stores/opportunityStore'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import OpportunityDetailPage from './pages/OpportunityDetailPage'
import SettingsPage from './pages/SettingsPage'
import api from './lib/axios'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUserStore()
  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}

function RootRedirect() {
  const { isAuthenticated, profile } = useUserStore()
  if (!isAuthenticated) return <AuthPage />
  if (!profile) return <Navigate to="/onboard" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  const location = useLocation()
  const { setUser, setProfile, setLoadingProfile, logout } = useUserStore()
  const [isInitializing, setIsInitializing] = useState(true)

  async function loadProfile(userId) {
    setLoadingProfile(true)
    try {
      const res = await api.get(`/api/resume/profile/${userId}`)
      if (res.data?.profile) {
        setProfile(res.data.profile)
      }
      // Load career analysis into opportunity store if available
      if (res.data?.analysis) {
        useOpportunityStore.getState().setCareerAnalysis(res.data.analysis)
        if (res.data.analysis.opportunity_matches?.length > 0) {
          useOpportunityStore.getState().setOpportunityMatches(res.data.analysis.opportunity_matches)
        }
      }
    } catch (e) {
      // Profile doesn't exist yet – onboarding needed
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user
        setUser({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.email.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url || null,
        })
        localStorage.setItem('oia_user_id', u.id)
        loadProfile(u.id)
      }
      setIsInitializing(false)
    })

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user
        setUser({
          id: u.id,
          email: u.email,
          name: u.user_metadata?.full_name || u.email.split('@')[0],
          avatarUrl: u.user_metadata?.avatar_url || null,
        })
        localStorage.setItem('oia_user_id', u.id)
        loadProfile(u.id)
      } else {
        logout()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-accent-cyan border-t-transparent animate-spin" />
          <p className="text-text-muted text-sm">Initializing...</p>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/onboard"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opportunity/:id"
          element={
            <ProtectedRoute>
              <OpportunityDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}
