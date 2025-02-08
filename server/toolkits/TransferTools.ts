import { StructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

class TransferToWeatherAdvisor extends StructuredTool {
  name = 'weatherAdvisorTransfer'
  description = 'Provides weather forecasts and clothing to pack by transferring to the \'weatherAdvisor\''
  schema = z.object({
    agent: z.any(),
  })

  returnDirect = true

  protected async _call(input: {agent: any}) {
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
