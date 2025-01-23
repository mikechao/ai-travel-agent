import type { Message as VercelChatMessage } from 'ai'

export function isInitMessage(message: VercelChatMessage) {
  if (message.data) {
    try {
      const initData = JSON.parse(message.data as string)
      return Object.prototype.hasOwnProperty.call(initData, 'init') && initData.init
    }
    catch (error) {
      console.error('Error parsing message.data', error)
      return false
    }
  }
  return false
}
