import type { StructuredToolInterface } from '@langchain/core/tools'
import { BaseToolkit, StructuredTool } from '@langchain/core/tools'
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
    return NodeNames.WeatherAdvisor
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
    return NodeNames.TravelAdvisor
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
    return NodeNames.HotelAdvisor
  }
}

class TransferToHuman extends StructuredTool {
  name = 'humanTransfer'
  description = `Gets input from the user, human, by transferring to the \'${NodeNames.HumanNode}\' node`
  schema = z.object({
    args: z.any(),
  })

  protected async _call(input: { args: any }) {
    consola.debug({ tags: 'humanTransfer', message: `called with ${JSON.stringify(input)}` })
    return NodeNames.HumanNode
  }
}

export class TransferTools extends BaseToolkit {
  tools: StructuredToolInterface[]
  transferToWeatherAdvisor: StructuredTool
  transferToTravelAdvisor: StructuredTool
  transferToHotelAdvisor: StructuredTool
  transferToHuman: StructuredTool
  transferToolsByName: Map<string, StructuredTool>
  transferLocationByToolName: Map<string, NodeNames>

  constructor() {
    super()
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
    this.transferToTravelAdvisor = new TransferToTravelAdvisor()
    this.transferToHotelAdvisor = new TransferToHotelAdvisor()
    this.transferToHuman = new TransferToHuman()

    this.tools = [
      this.transferToWeatherAdvisor,
      this.transferToTravelAdvisor,
      this.transferToHotelAdvisor,
      this.transferToHuman,
    ]

    this.transferToolsByName = new Map<string, StructuredTool>()
    this.transferToolsByName.set(this.transferToWeatherAdvisor.name, this.transferToWeatherAdvisor)
    this.transferToolsByName.set(this.transferToTravelAdvisor.name, this.transferToTravelAdvisor)
    this.transferToolsByName.set(this.transferToHotelAdvisor.name, this.transferToHotelAdvisor)
    this.transferToolsByName.set(this.transferToHuman.name, this.transferToHuman)

    this.transferLocationByToolName = new Map<string, NodeNames>()
    this.transferLocationByToolName.set(this.transferToWeatherAdvisor.name, NodeNames.WeatherAdvisor)
    this.transferLocationByToolName.set(this.transferToTravelAdvisor.name, NodeNames.TravelAdvisor)
    this.transferLocationByToolName.set(this.transferToHotelAdvisor.name, NodeNames.HotelAdvisor)
    this.transferLocationByToolName.set(this.transferToHuman.name, NodeNames.HumanNode)
  }

  getToolsForHotelAdvisor(): StructuredTool[] {
    return [this.transferToHuman, this.transferToWeatherAdvisor, this.transferToTravelAdvisor]
  }

  getToolsForWeatherAdvisor(): StructuredTool[] {
    return [this.transferToHuman, this.transferToTravelAdvisor, this.transferToWeatherAdvisor, this.transferToHotelAdvisor]
  }

  getToolsForTravelAdvisor(): StructuredTool[] {
    return [this.transferToHuman, this.transferToWeatherAdvisor, this.transferToHotelAdvisor]
  }

  getTransferToolsByName() {
    return this.transferToolsByName
  }

  getTransferLocationByToolName() {
    return this.transferLocationByToolName
  }
}
