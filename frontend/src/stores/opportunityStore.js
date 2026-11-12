import { create } from 'zustand'
import { loadLanguage, saveLanguage } from '../lib/languages'
import { DEMOS } from '../demo/demoData'

function normalizeCareerAnalysis(raw) {
  if (!raw) return null
  return {
    resumeScore: raw.resumeScore ?? 0,
    employabilityScore: raw.employabilityScore ?? 0,
    careerReadinessScore: raw.careerReadinessScore ?? 0,
    domainFit: raw.domainFit ?? 'Technology',
    strengths: raw.strengths ?? [],
    improvementAreas: raw.improvementAreas ?? [],
    recommendedRoles: raw.recommendedRoles ?? [],
    skillGaps: raw.skillGaps ?? [],
    plan30Days: raw.plan30Days ?? [],
    plan90Days: raw.plan90Days ?? [],
    plan180Days: raw.plan180Days ?? [],
    aiNarrative: raw.aiNarrative ?? '',
  }
}

const useOpportunityStore = create((set) => ({
  profile: null,
  careerAnalysis: null,
  opportunityMatches: [],
  savedOpportunities: [],
  dashboardFilterQuery: '',
  dashboardFilterMinScore: 0,

  // Preferences. Neither is persisted: the API key stays in memory only, and the language
  // lives in localStorage purely as a convenience.
  language: loadLanguage(),
  apiKey: '',
  // Module results are cached for the session, keyed by module + language + input.
  moduleResults: {},

  // Answers from the optional "Returning to work" form. Client state only; joins module prompts once submitted.
  comeback: null,
  setComeback: (comeback) => set({ comeback }),

  // Demo mode: sample candidate + canned module results, no resume, no API key, no network.
  demo: false,
  demoPersona: null,
  loadDemo: (personaId = 'returner') => {
    const persona = DEMOS[personaId] || DEMOS.returner
    set({
      demo: true,
      demoPersona: persona.id,
      profile: persona.profile,
      careerAnalysis: normalizeCareerAnalysis(persona.analysis),
      opportunityMatches: persona.matches,
      moduleResults: {},
      // A returning-to-work demo arrives with the form already answered, as if the user had filled it in.
      comeback: persona.comeback,
    })
  },

  setProfile: (profile) => set({ profile }),
  setCareerAnalysis: (raw) => set({ careerAnalysis: normalizeCareerAnalysis(raw) }),
  setOpportunityMatches: (opportunityMatches) => set({ opportunityMatches }),
  setLanguage: (language) => {
    saveLanguage(language)
    set({ language })
  },
  setApiKey: (apiKey) => set({ apiKey }),
  setModuleResult: (key, value) => set((state) => ({ moduleResults: { ...state.moduleResults, [key]: value } })),
  setDashboardFilter: (query, minScore) =>
    set({ dashboardFilterQuery: query || '', dashboardFilterMinScore: minScore || 0 }),
  toggleSaved: (opportunityId) =>
    set((state) => {
      const opp = state.opportunityMatches.find((o) => o.id === opportunityId)
      const isSaved = state.savedOpportunities.some((o) => o.id === opportunityId)
      if (isSaved) {
        return { savedOpportunities: state.savedOpportunities.filter((o) => o.id !== opportunityId) }
      }
      return {
        savedOpportunities: opp ? [...state.savedOpportunities, { ...opp, isSaved: true }] : state.savedOpportunities,
      }
    }),
  reset: () =>
    set({
      profile: null,
      careerAnalysis: null,
      opportunityMatches: [],
      savedOpportunities: [],
      dashboardFilterQuery: '',
      dashboardFilterMinScore: 0,
      moduleResults: {},
      comeback: null,
      demo: false,
      demoPersona: null,
    }),
}))

export default useOpportunityStore
