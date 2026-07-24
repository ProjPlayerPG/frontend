import { beforeEach, describe, expect, it } from 'vitest'
import {
  CHATBOT_HISTORY_STORAGE_KEY,
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
    saveChatbotHistory(history)

    expect(loadChatbotHistory()).toEqual(history)
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
