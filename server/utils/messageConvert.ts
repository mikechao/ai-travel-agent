import { BaseMessage, AIMessage } from "@langchain/core/messages";

export function convertLangChainMessageToVercelMessage(message: BaseMessage) {
  switch (message.getType()) {
    case 'human':
      return {
        id: message.id,
        createdAt: new Date(),
        content: message.content,
        role: 'user'
      }
    case 'ai':
      return {
        id: message.id,
        createdAt: new Date(),
        content: message.content,
        role: 'assistant'
      }
  }
}