import type { StructuredToolInterface } from '@langchain/core/tools'
import { BaseToolkit, StructuredTool } from '@langchain/core/tools'
import consola from 'consola'
import { z } from 'zod'
import { NodeNames } from '~/types/enums'

export const TransferToolTags = Object.freeze({
  HotelTransfer: 'transfer-to-hotel' as const,
  TravelTransfer: 'transfer-to-travel' as const,
  WeatherTransfer: 'transfer-to-weather' as const,
  SightseeingTransfer: 'transfer-to-sights' as const,
})

export const TransferToolNames = Object.freeze({
  HotelTransfer: 'hotelAdvisorTransfer' as const,
  TravelTransfer: 'travelAdvisorTransfer' as const,
  WeatherTransfer: 'weatherAdvisorTransfer' as const,
  SightseeingTransfer: 'sightseeingTransfer' as const,
})

class TransferToWeatherAdvisor extends StructuredTool {
  name = TransferToolNames.WeatherTransfer
  description = 'Provides weather forecasts and clothing to pack advice by transferring to the agent named Petey the Pirate'
  schema = z.object({
    agent: z.any(),
  })

  protected async _call(input: { agent: any }) {
    consola.debug({ tag: TransferToolNames.WeatherTransfer, message: `called with ${JSON.stringify(input.agent)}` })
    const result: AdvisorTransferResult = { goto: NodeNames.WeatherAdvisor, agentName: 'Petey the Pirate' }
    return JSON.stringify(result)
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
    const result: AdvisorTransferResult = { goto: NodeNames.TravelAdvisor, agentName: 'Pluto the Pup' }
    return JSON.stringify(result)
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
    const result: AdvisorTransferResult = { goto: NodeNames.HotelAdvisor, agentName: 'Penny Restmore' }
    return JSON.stringify(result)
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
    const result: AdvisorTransferResult = { goto: NodeNames.SightseeingAdvisor, agentName: 'Polly Parrot' }
    return JSON.stringify(result)
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
    this.toolTags = new Map<string, string>([
      [TransferToolNames.HotelTransfer, TransferToolTags.HotelTransfer],
      [TransferToolNames.SightseeingTransfer, TransferToolTags.SightseeingTransfer],
      [TransferToolNames.TravelTransfer, TransferToolTags.TravelTransfer],
      [TransferToolNames.WeatherTransfer, TransferToolTags.WeatherTransfer],
    ])
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
