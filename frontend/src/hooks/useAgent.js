import useOpportunityStore from '../stores/opportunityStore'
import useUserStore from '../stores/userStore'

export function useAgent() {
  const {
    addAgentStep,
    clearAgentSteps,
    setOpportunities,
    setCareerStrategy,
    setSearching,
    setCurrentQuery,
  } = useOpportunityStore()
  const { user } = useUserStore()

  async function runQuery(query) {
    if (!query?.trim()) return

    clearAgentSteps()
    setSearching(true)
    setCurrentQuery(query)

    const userId = user?.id || localStorage.getItem('oia_user_id') || 'anonymous'

    try {
      const response = await fetch('/api/agent/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query, userId }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const raw = trimmed.slice(5).trim()
          if (!raw || raw === '[DONE]') continue

          try {
            const event = JSON.parse(raw)
            handleEvent(event)
          } catch (e) {
            console.warn('Failed to parse SSE event:', raw)
          }
        }
      }
    } catch (error) {
      console.error('Agent query error:', error)
      addAgentStep({
        step: 'error',
        message: `Error: ${error.message}`,
        status: 'failed',
      })
      setSearching(false)
    }
  }

  function handleEvent(event) {
    switch (event.type) {
      case 'step':
        addAgentStep({
          step: event.step,
          message: event.message,
          status: event.status || 'running',
        })
        break

      case 'opportunities':
        setOpportunities(event.data || [])
        addAgentStep({
          step: 'results',
          message: `Found ${event.data?.length || 0} opportunities`,
          status: 'done',
        })
        break

      case 'career_strategy':
        setCareerStrategy(event.data)
        break

      case 'complete':
        setSearching(false)
        addAgentStep({
          step: 'complete',
          message: event.message || 'Analysis complete',
          status: 'done',
        })
        break

      case 'conversational':
        if (event.data?.uiAction && event.data.uiAction.type === 'filter_dashboard') {
          useOpportunityStore.getState().setDashboardFilter(
            event.data.uiAction.searchQuery || '',
            event.data.uiAction.minScore || 0
          )
        }
        break

      case 'error':
        addAgentStep({
          step: 'error',
          message: event.message || 'An error occurred',
          status: 'failed',
        })
        setSearching(false)
        break

      default:
        break
    }
  }

  return { runQuery }
}
