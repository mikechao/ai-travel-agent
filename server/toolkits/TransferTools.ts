import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'

class TransferToWeatherAdvisor extends StructuredTool {
  name = 'weatherAdvisorTransfer'
  description = 'Provides weather forecasts and clothing to pack advice by transferring to the \'weatherAdvisor\' named Petey the Pirate'
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: {agent: any}) {
    consola.debug({tag: 'weatherAdvisorTransfer', message: `called with ${input.agent}`})
    return `Successfully transferred to ${input.agent}`
  }
}

class TransferToTravelAdvisor extends StructuredTool {
  name = 'travelAdvisorTransfer'
  description = `Provides travel destinations recommendations by transferring to the agent \'travelAdvisor\' named Pluto the Pup`
  schema = z.object({
    agent: z.any()
  })
  protected async _call(input: {agent: any}) {
    consola.debug({tag: 'travelAdvisorTransfer', message: `called with ${input.agent}`})
    return `Successfully transferred to ${input.agent}`
  }
}

export class TransferTools {
  transferToWeatherAdvisor: StructuredTool
  transferToTravelAdvisor: StructuredTool

  constructor() {
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
    this.transferToTravelAdvisor = new TransferToTravelAdvisor()
  }

  getTransferToWeatherAdvisorTool() {
    return this.transferToWeatherAdvisor
  }

  getTransferToTravelAdvisor() {
    return this.transferToTravelAdvisor
  }
}
