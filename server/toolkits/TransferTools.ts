import { StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { NodeNames } from '~/types/enums'

class TransferToWeatherAdvisor extends StructuredTool {
  name = 'weatherAdvisorTransfer'
  description = 'Provides weather forecasts and clothing to pack advice by transferring to the \'weatherAdvisor\' named Petey the Pirate'
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: 'weatherAdvisorTransfer', message: `called with ${JSON.stringify(input.agent)}` })
    return `Successfully transferred to ${input.agent}`
  }
}

class TransferToTravelAdvisor extends StructuredTool {
  name = 'travelAdvisorTransfer'
  description = `Provides travel destinations recommendations by transferring to the agent \'travelAdvisor\' named Pluto the Pup`
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: 'travelAdvisorTransfer', message: `called with ${JSON.stringify(input.agent)}` })
    return `Successfully transferred to ${input.agent}`
  }
}

export class TransferTools {
  transferToWeatherAdvisor: StructuredTool
  transferToTravelAdvisor: StructuredTool
  transferToolsByName: Map<string, StructuredTool>
  transferLocationByToolName: Map<string, NodeNames>

  constructor() {
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
    this.transferToTravelAdvisor = new TransferToTravelAdvisor()
    this.transferToolsByName = new Map<string, StructuredTool>()
    this.transferToolsByName.set(this.transferToWeatherAdvisor.name, this.transferToWeatherAdvisor)
    this.transferToolsByName.set(this.transferToTravelAdvisor.name, this.transferToTravelAdvisor)
    this.transferLocationByToolName = new Map<string, NodeNames>()
    this.transferLocationByToolName.set(this.transferToWeatherAdvisor.name, NodeNames.WeatherAdvisor)
    this.transferLocationByToolName.set(this.transferToTravelAdvisor.name, NodeNames.TravelAdvisor)
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

  getTransferLocationByToolName() {
    return this.transferLocationByToolName
  }
}
