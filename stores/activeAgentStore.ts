import { type AgentName, AgentNames, AgentToEmoji } from '~/types/constants'

export const useActiveAgentStore = defineStore('activeAgent', () => {
  const activeAgent: Ref<AgentName> = ref(AgentNames.PLUTO)

  function getEmoji() {
    return AgentToEmoji[activeAgent.value]
  }

  function setActiveAgent(agent: AgentName) {
    activeAgent.value = agent
  }

  return {
    getEmoji,
    setActiveAgent,
    activeAgent,
  }
})
