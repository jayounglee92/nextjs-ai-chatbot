import type { UserTypes } from '@/app/(auth)/auth'
import type { ChatModel } from './models'

interface Entitlements {
  maxMessagesPerDay: number
  availableChatModelIds: Array<ChatModel['id']>
}

export const entitlementsByUserType: Record<UserTypes, Entitlements> = {
  /*
   * For users with an account
   */
  AI_ADMIN: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },

  GENERAL: {
    maxMessagesPerDay: 100,
    availableChatModelIds: ['chat-model', 'chat-model-reasoning'],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
}
