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

export class TransferTools {
  transferToWeatherAdvisor: StructuredTool
  constructor() {
    this.transferToWeatherAdvisor = new TransferToWeatherAdvisor()
  }

  getTransferToWeatherAdvisorTool() {
    return this.transferToWeatherAdvisor
  }
}
