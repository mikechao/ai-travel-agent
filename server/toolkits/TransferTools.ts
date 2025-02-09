import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'

enum TransferToolName {
  WeatherAdvisorTransfer = 'weatherAdvisorTransfer',
  TravelAdvisorTransfer = 'travelAdvisorTransfer'
}

class TransferToWeatherAdvisor extends StructuredTool {
  name = TransferToolName.WeatherAdvisorTransfer
  description = 'Provides weather forecasts and clothing to pack advice by transferring to the \'weatherAdvisor\' named Petey the Pirate'
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: {agent: any}) {
    consola.debug({tag: TransferToolName.WeatherAdvisorTransfer, message: `called with ${JSON.stringify(input.agent)}`})
    return `Successfully transferred to ${input.agent}`
  }
}

class TransferToTravelAdvisor extends StructuredTool {
  name = TransferToolName.TravelAdvisorTransfer
  description = `Provides travel destinations recommendations by transferring to the agent \'travelAdvisor\' named Pluto the Pup`
  schema = z.object({
    agent: z.any()
  })
  protected async _call(input: {agent: any}) {
    consola.debug({tag: TransferToolName.TravelAdvisorTransfer, message: `called with ${JSON.stringify(input.agent)}`})
    return `Successfully transferred to ${input.agent}`
  }
}

export class TransferTools {
  transferToWeatherAdvisor: StructuredTool
  transferToTravelAdvisor: StructuredTool
  transferToolsByName: Map<string, StructuredTool>

  constructor() {
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
    this.transferToTravelAdvisor = new TransferToTravelAdvisor()
    this.transferToolsByName = new Map<string, StructuredTool>()
    this.transferToolsByName.set(this.transferToWeatherAdvisor.name, this.transferToWeatherAdvisor)
    this.transferToolsByName.set(this.transferToTravelAdvisor.name, this.transferToTravelAdvisor)
  }

  getTransferToWeatherAdvisor() {
    return this.transferToWeatherAdvisor
  }

  getTransferToTravelAdvisor() {
    return this.transferToTravelAdvisor
  }

  getTransferToolsByName() {
    return this.transferToolsByName
  }
}
