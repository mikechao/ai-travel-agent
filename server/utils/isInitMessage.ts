import {Message as VercelChatMessage } from "ai"

export function isInitMessage(message: VercelChatMessage) {
  if (message.data) {
    try {
      const initData = JSON.parse(message.data as string)
      return initData.hasOwnProperty('init') && initData['init']
    } catch (error) {
      return false
    }
  }
  return false
}