import type { StructuredToolInterface } from '@langchain/core/tools'
import { BaseToolkit, StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { NodeNames } from '~/types/enums'

export const TransferToolNames = {
  HotelTransfer: 'hotelAdvisorTransfer',
  TravelTransfer: 'travelAdvisorTransfer',
  WeatherTransfer: 'weatherAdvisorTransfer',
} as const

class TransferToWeatherAdvisor extends StructuredTool {
  name = TransferToolNames.WeatherTransfer
  description = 'Provides weather forecasts and clothing to pack advice by transferring to the \'weatherAdvisor\' named Petey the Pirate'
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: TransferToolNames.WeatherTransfer, message: `called with ${JSON.stringify(input.agent)}` })
    return NodeNames.WeatherAdvisor
  }
}

class TransferToTravelAdvisor extends StructuredTool {
  name = TransferToolNames.TravelTransfer
  description = `Provides travel destinations recommendations by transferring to the agent \'travelAdvisor\' named Pluto the Pup`
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: TransferToolNames.TravelTransfer, message: `called with ${JSON.stringify(input.agent)}` })
    return NodeNames.TravelAdvisor
  }
}

class TransferToHotelAdvisor extends StructuredTool {
  name = TransferToolNames.HotelTransfer
  description = `Provides hotel recommendations, search and details by transferring to the agent \'${NodeNames.HotelAdvisor}' named Penny Restmore`
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: TransferToolNames.HotelTransfer, message: `called with ${JSON.stringify(input.agent)}` })
    return NodeNames.HotelAdvisor
  }
}

export class TransferToolKit extends BaseToolkit {
  tools: StructuredToolInterface[]
  transferToWeatherAdvisor: StructuredTool
  transferToTravelAdvisor: StructuredTool
  transferToHotelAdvisor: StructuredTool
  transferToolsByName: Map<string, StructuredTool>
  transferLocationByToolName: Map<string, NodeNames>

  constructor() {
    super()
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
    this.transferToTravelAdvisor = new TransferToTravelAdvisor()
    this.transferToHotelAdvisor = new TransferToHotelAdvisor()

    this.tools = [
      this.transferToWeatherAdvisor,
      this.transferToTravelAdvisor,
      this.transferToHotelAdvisor,
    ]

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
}
