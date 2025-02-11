import type { StructuredToolInterface } from '@langchain/core/tools'
import { BaseToolkit, StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { NodeNames } from '~/types/enums'

export const TransferToolTags = {
  HotelTransfer: 'transfer-to-hotel',
  TravelTransfer: 'transfer-to-travel',
  WeatherTransfer: 'transfer-to-weather',
  SightseeingTransfer: 'transfer-to-sights',
} as const

export const TransferToolNames = {
  HotelTransfer: 'hotelAdvisorTransfer',
  TravelTransfer: 'travelAdvisorTransfer',
  WeatherTransfer: 'weatherAdvisorTransfer',
  SightseeingTransfer: 'sightseeingTransfer',
} as const

class TransferToWeatherAdvisor extends StructuredTool {
  name = TransferToolNames.WeatherTransfer
  description = 'Provides weather forecasts and clothing to pack advice by transferring to the agent named Petey the Pirate'
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
  description = `Provides travel destinations recommendations by transferring to the agent named Pluto the Pup`
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
  description = `Provides hotel recommendations, search and details by transferring to the agent named Penny Restmore`
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: TransferToolNames.HotelTransfer, message: `called with ${JSON.stringify(input.agent)}` })
    return NodeNames.HotelAdvisor
  }
}

class TransferToSightseeingAdvisor extends StructuredTool {
  name = TransferToolNames.SightseeingTransfer
  description = `Provides sightseeing or attractions recommendations by transferring to the agent named Polly Parrot`
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: TransferToolNames.SightseeingTransfer, message: `called with ${JSON.stringify(input.agent)}` })
    return NodeNames.SightseeingAdvisor
  }
}

export class TransferToolKit extends BaseToolkit {
  tools: StructuredToolInterface[]
  private readonly transferToWeatherAdvisor: StructuredTool
  private readonly transferToTravelAdvisor: StructuredTool
  private readonly transferToHotelAdvisor: StructuredTool
  private readonly transferToSightseeingAdvisor: StructuredTool
  private readonly toolTags: Map<string, string>

  constructor() {
    super()
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
    this.transferToTravelAdvisor = new TransferToTravelAdvisor()
    this.transferToHotelAdvisor = new TransferToHotelAdvisor()
    this.transferToSightseeingAdvisor = new TransferToSightseeingAdvisor()

    this.tools = [
      this.transferToWeatherAdvisor,
      this.transferToTravelAdvisor,
      this.transferToHotelAdvisor,
      this.transferToSightseeingAdvisor,
    ]
    this.toolTags = new Map<string, string>()
    this.toolTags.set(TransferToolNames.HotelTransfer, TransferToolTags.HotelTransfer)
    this.toolTags.set(TransferToolNames.SightseeingTransfer, TransferToolTags.SightseeingTransfer)
    this.toolTags.set(TransferToolNames.TravelTransfer, TransferToolTags.TravelTransfer)
    this.toolTags.set(TransferToolNames.WeatherTransfer, TransferToolTags.WeatherTransfer)
  }

  public getTransferTool(nodeName: NodeNames) {
    switch (nodeName) {
      case NodeNames.WeatherAdvisor:
        return [this.transferToTravelAdvisor, this.transferToHotelAdvisor, this.transferToSightseeingAdvisor]
      case NodeNames.HotelAdvisor:
        return [this.transferToWeatherAdvisor, this.transferToTravelAdvisor, this.transferToSightseeingAdvisor]
      case NodeNames.TravelAdvisor:
        return [this.transferToWeatherAdvisor, this.transferToHotelAdvisor, this.transferToSightseeingAdvisor]
      case NodeNames.SightseeingAdvisor:
        return [this.transferToWeatherAdvisor, this.transferToTravelAdvisor, this.transferToHotelAdvisor]
      default:
        throw new Error(`No transfer tools for ${nodeName}`)
    }
  }

  /**
   *
   * @returns A Map where the key is the name of the tool
   *
   * And the value are tags that should be used when they are invoked
   *
   */
  getToolTags(): Map<string, string> {
    return this.toolTags
  }
}
