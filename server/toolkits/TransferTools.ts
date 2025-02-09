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

class TransferToHotelAdvisor extends StructuredTool {
  name = 'hotelAdvisorTransfer'
  description = `Provides hotel recommendations, search and details by transferring to the agent \'${NodeNames.HotelAdvisor}' named Penny Restmore`
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: 'hotelAdvisorTransfer', message: `called with ${JSON.stringify(input.agent)}` })
    return `Successfully transferred to ${input.agent}`
  }
}

export class TransferTools {
  transferToWeatherAdvisor: StructuredTool
  transferToTravelAdvisor: StructuredTool
  transferToHotelAdvisor: StructuredTool
  transferToolsByName: Map<string, StructuredTool>
  transferLocationByToolName: Map<string, NodeNames>

  constructor() {
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
    this.transferToTravelAdvisor = new TransferToTravelAdvisor()
    this.transferToHotelAdvisor = new TransferToHotelAdvisor()

    this.transferToolsByName = new Map<string, StructuredTool>()
    this.transferToolsByName.set(this.transferToWeatherAdvisor.name, this.transferToWeatherAdvisor)
    this.transferToolsByName.set(this.transferToTravelAdvisor.name, this.transferToTravelAdvisor)
    this.transferToolsByName.set(this.transferToHotelAdvisor.name, this.transferToHotelAdvisor)

    this.transferLocationByToolName = new Map<string, NodeNames>()
    this.transferLocationByToolName.set(this.transferToWeatherAdvisor.name, NodeNames.WeatherAdvisor)
    this.transferLocationByToolName.set(this.transferToTravelAdvisor.name, NodeNames.TravelAdvisor)
    this.transferLocationByToolName.set(this.transferToHotelAdvisor.name, NodeNames.HotelAdvisor)
  }

  getToolsForHotelAdvisor(): StructuredTool[] {
    return [this.transferToWeatherAdvisor, this.transferToTravelAdvisor]
  }

  getToolsForWeatherAdvisor(): StructuredTool[] {
    return [this.transferToTravelAdvisor, this.transferToWeatherAdvisor, this.transferToHotelAdvisor]
  }

  getToolsForTravelAdvisor(): StructuredTool[] {
    return [this.transferToWeatherAdvisor, this.transferToHotelAdvisor]
  }

  getTransferToolsByName() {
    return this.transferToolsByName
  }

  getTransferLocationByToolName() {
    return this.transferLocationByToolName
  }
}
