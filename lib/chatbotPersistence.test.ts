import { beforeEach, describe, expect, it } from 'vitest'
import {
  CHATBOT_HISTORY_STORAGE_KEY,
  CHATBOT_HISTORY_TTL_MS,
  loadChatbotHistory,
  saveChatbotHistory,
  type ChatbotHistory,
} from './chatbotPersistence'

const history: ChatbotHistory = {
  message: 'Un RPG tactique avec une bonne histoire',
  recommendations: [
    {
      id: 123,
      name: 'Example RPG',
      reason: 'Il correspond aux critères demandés.',
    },
  ],
}

describe('chatbotPersistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores the last successful search', () => {
    saveChatbotHistory(history, localStorage, 1_000)

    expect(loadChatbotHistory(localStorage, 1_000 + CHATBOT_HISTORY_TTL_MS - 1)).toEqual(history)
  })

  it('expires and removes a search after 24 hours', () => {
    saveChatbotHistory(history, localStorage, 1_000)

    expect(loadChatbotHistory(localStorage, 1_000 + CHATBOT_HISTORY_TTL_MS)).toBeNull()
    expect(localStorage.getItem(CHATBOT_HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('removes history created before expiration dates were introduced', () => {
    localStorage.setItem(CHATBOT_HISTORY_STORAGE_KEY, JSON.stringify(history))

    expect(loadChatbotHistory(localStorage, 1_000)).toBeNull()
    expect(localStorage.getItem(CHATBOT_HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('ignores and removes malformed history', () => {
    localStorage.setItem(
      CHATBOT_HISTORY_STORAGE_KEY,
      JSON.stringify({ message: 'RPG', recommendations: [{ id: 'invalid' }] }),
    )

    expect(loadChatbotHistory()).toBeNull()
    expect(localStorage.getItem(CHATBOT_HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('ignores invalid JSON', () => {
    localStorage.setItem(CHATBOT_HISTORY_STORAGE_KEY, '{invalid')

    expect(loadChatbotHistory()).toBeNull()
    expect(localStorage.getItem(CHATBOT_HISTORY_STORAGE_KEY)).toBeNull()
  })

  it('keeps working when browser storage is blocked', () => {
    const blockedStorage = {
      getItem: () => {
        throw new Error('Storage blocked')
      },
      removeItem: () => {
        throw new Error('Storage blocked')
      },
    }

    expect(loadChatbotHistory(blockedStorage)).toBeNull()
  })
})
