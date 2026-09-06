export type ChatbotRecommendation = {
  id: number
  name: string
  reason: string
}

export type ChatbotHistory = {
  message: string
  recommendations: ChatbotRecommendation[]
}

export const CHATBOT_HISTORY_STORAGE_KEY = 'playerpg:chatbot-history:v1'
export const CHATBOT_HISTORY_TTL_MS = 24 * 60 * 60 * 1000

type ReadableStorage = Pick<Storage, 'getItem' | 'removeItem'>
type WritableStorage = Pick<Storage, 'setItem'>

function browserStorage() {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function removeInvalidHistory(storage: ReadableStorage) {
  try {
    storage.removeItem(CHATBOT_HISTORY_STORAGE_KEY)
  } catch {
    // Some privacy modes expose localStorage while denying access to it.
  }
}

function isRecommendation(value: unknown): value is ChatbotRecommendation {
  if (!value || typeof value !== 'object') return false

  const recommendation = value as Partial<ChatbotRecommendation>

  return (
    Number.isInteger(recommendation.id) &&
    typeof recommendation.name === 'string' &&
    recommendation.name.length > 0 &&
    typeof recommendation.reason === 'string'
  )
}

export function loadChatbotHistory(
  storage: ReadableStorage | null = browserStorage(),
  now = Date.now(),
): ChatbotHistory | null {
  if (!storage) return null

  try {
    const serializedHistory = storage.getItem(CHATBOT_HISTORY_STORAGE_KEY)
    if (!serializedHistory) return null

    const history = JSON.parse(serializedHistory) as Partial<ChatbotHistory> & { savedAt?: number }
    if (
      typeof history.message !== 'string' ||
      !Array.isArray(history.recommendations) ||
      !history.recommendations.every(isRecommendation) ||
      typeof history.savedAt !== 'number' ||
      !Number.isFinite(history.savedAt) ||
      now - history.savedAt >= CHATBOT_HISTORY_TTL_MS
    ) {
      removeInvalidHistory(storage)
      return null
    }

    return {
      message: history.message,
      recommendations: history.recommendations,
    }
  } catch {
    removeInvalidHistory(storage)
    return null
  }
}

export function saveChatbotHistory(
  history: ChatbotHistory,
  storage: WritableStorage | null = browserStorage(),
  now = Date.now(),
) {
  if (!storage) return

  try {
    storage.setItem(CHATBOT_HISTORY_STORAGE_KEY, JSON.stringify({ ...history, savedAt: now }))
  } catch {
    // A recommendation should remain usable even if browser storage is unavailable.
  }
}
