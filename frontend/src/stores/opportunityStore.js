import { create } from 'zustand'

/**
 * Normalize DB snake_case career analysis to camelCase used by components.
 * Handles both camelCase (from Gemini SSE stream) and snake_case (from DB fetch).
 */
function normalizeCareerAnalysis(raw) {
  if (!raw) return null
  return {
    // Scores
    resumeScore:          raw.resumeScore          ?? raw.resume_score          ?? 0,
    employabilityScore:   raw.employabilityScore   ?? raw.employability_score   ?? 0,
    careerReadinessScore: raw.careerReadinessScore ?? raw.career_readiness_score ?? 0,
    // Domain
    domainFit:            raw.domainFit            ?? raw.domain_fit            ?? 'Technology',
    // Arrays
    strengths:            raw.strengths            ?? [],
    improvementAreas:     raw.improvementAreas     ?? raw.improvement_areas     ?? [],
    recommendedRoles:     raw.recommendedRoles     ?? raw.recommended_roles     ?? [],
    skillGaps:            raw.skillGaps            ?? raw.skill_gaps            ?? [],
    // Roadmap
    plan30Days:           raw.plan30Days           ?? raw.plan_30_days          ?? [],
    plan90Days:           raw.plan90Days           ?? raw.plan_90_days          ?? [],
    plan180Days:          raw.plan180Days          ?? raw.plan_180_days         ?? [],
    // Narrative
    aiNarrative:          raw.aiNarrative          ?? raw.ai_narrative          ?? '',
    // Pass-through for DB fields
    opportunity_matches:  raw.opportunity_matches  ?? [],
  }
}

const useOpportunityStore = create((set, get) => ({
  // Opportunities
  opportunities: [],
  savedOpportunities: [],
  activeCategory: 'all',

  // Agent pipeline
  agentSteps: [],
  isSearching: false,
  currentQuery: '',
  dashboardFilterQuery: '',
  dashboardFilterMinScore: 0,

  // Career Intelligence (normalized camelCase)
  careerAnalysis: null,
  opportunityMatches: [],
  careerStrategy: null,

  // Chat
  chatMessages: [],
  isChatLoading: false,

  // Setters
  setOpportunities: (opportunities) => set({ opportunities }),
  setCareerAnalysis: (raw) => set({ careerAnalysis: normalizeCareerAnalysis(raw) }),
  setOpportunityMatches: (opportunityMatches) => set({ opportunityMatches }),
  addAgentStep: (step) => set((state) => ({
    agentSteps: [...state.agentSteps, { ...step, timestamp: new Date().toISOString() }],
  })),
  updateAgentStep: (stepId, updates) => set((state) => ({
    agentSteps: state.agentSteps.map(s => s.stepId === stepId ? { ...s, ...updates } : s),
  })),
  clearAgentSteps: () => set({ agentSteps: [] }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  setSearching: (bool) => set({ isSearching: bool }),
  setCareerStrategy: (strategy) => set({ careerStrategy: strategy }),
  setCurrentQuery: (query) => set({ currentQuery: query }),
  setDashboardFilter: (query, minScore) => set({ dashboardFilterQuery: query || '', dashboardFilterMinScore: minScore || 0 }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, { ...message, timestamp: new Date().toISOString() }],
  })),
  setChatLoading: (bool) => set({ isChatLoading: bool }),
  toggleSaved: (opportunityId) => set((state) => {
    const opp = state.opportunityMatches.find((o) => o.id === opportunityId)
    const isSaved = state.savedOpportunities.some((o) => o.id === opportunityId)
    if (isSaved) {
      return { savedOpportunities: state.savedOpportunities.filter((o) => o.id !== opportunityId) }
    } else {
      return {
        savedOpportunities: opp
          ? [...state.savedOpportunities, { ...opp, isSaved: true }]
          : state.savedOpportunities,
      }
    }
  }),
}))

export default useOpportunityStore
