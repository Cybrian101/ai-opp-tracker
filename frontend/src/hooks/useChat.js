import { useCallback } from 'react'
import useOpportunityStore from '../stores/opportunityStore'

export function useChat() {
  const { addChatMessage, setChatLoading, chatMessages, isChatLoading } = useOpportunityStore()

  const sendMessage = useCallback(async (query, userId) => {
    if (!query?.trim()) return
    if (!userId) return

    // Add user message immediately
    addChatMessage({ role: 'user', content: query })
    setChatLoading(true)

    // Add placeholder assistant message to stream into
    const assistantMsgId = `assistant_${Date.now()}`
    addChatMessage({ role: 'assistant', content: '', id: assistantMsgId, streaming: true })

    try {
      const response = await fetch('/api/analysis/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ query, userId }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let accumulatedContent = ''

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

            if (event.type === 'token' || event.type === 'chunk') {
              accumulatedContent += event.content || event.token || ''
              // Update the streaming message
              useOpportunityStore.setState((state) => ({
                chatMessages: state.chatMessages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulatedContent }
                    : m
                ),
              }))
            } else if (event.type === 'answer' || event.type === 'response') {
              const data = event.data || {}
              accumulatedContent = data.text || event.content || accumulatedContent
              
              if (data.uiAction && data.uiAction.type === 'filter_dashboard') {
                useOpportunityStore.getState().setDashboardFilter(
                  data.uiAction.searchQuery || '',
                  data.uiAction.minScore || 0
                )
              }

              useOpportunityStore.setState((state) => ({
                chatMessages: state.chatMessages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulatedContent, streaming: false }
                    : m
                ),
              }))
            } else if (event.type === 'complete') {
              if (event.content || event.message) {
                accumulatedContent = event.content || event.message
              }
              // Mark streaming done
              useOpportunityStore.setState((state) => ({
                chatMessages: state.chatMessages.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulatedContent || m.content, streaming: false }
                    : m
                ),
              }))
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Chat error')
            }
          } catch (e) {
            if (e.message?.includes('JSON')) continue
            throw e
          }
        }
      }

      // Finalize the streaming message
      useOpportunityStore.setState((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: accumulatedContent || m.content, streaming: false }
            : m
        ),
      }))
    } catch (err) {
      // Update the placeholder with error
      useOpportunityStore.setState((state) => ({
        chatMessages: state.chatMessages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: `Sorry, I encountered an error: ${err.message}`, streaming: false, error: true }
            : m
        ),
      }))
    } finally {
      setChatLoading(false)
    }
  }, [addChatMessage, setChatLoading])

  return {
    sendMessage,
    isLoading: isChatLoading,
    messages: chatMessages,
  }
}

export default useChat
