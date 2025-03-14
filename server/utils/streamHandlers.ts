import type { AIMessageChunk, ToolMessage } from '@langchain/core/messages'
import { isAIMessageChunk } from '@langchain/core/messages'
import { formatDataStreamPart } from 'ai'
import consola from 'consola'
import { v4 as uuidv4 } from 'uuid'
import { DataItemTypes } from '../../types/constants'
import { ImageSearchToolTag } from '../toolkits/GeocodeToolKit'
import { HotelToolTags } from '../toolkits/HotelToolKit'
import { SightseeingToolTags } from '../toolkits/SightseeingToolKit'
import { TransferToolTags } from '../toolkits/TransferToolKit'
import { TravelRecommendToolTags } from '../toolkits/TravelRecommendToolKit'
import { WeatherToolTags } from '../toolkits/WeatherToolKit'

export interface StreamEventHandlers {
  handleChatModelStream: (event: any, controller: ReadableStreamDefaultController, encoder: TextEncoder) => void
  handleToolEnd: (event: any, controller: ReadableStreamDefaultController, encoder: TextEncoder) => void
}

export function createStreamEventHandlers(): StreamEventHandlers {
  return {
    handleChatModelStream(event, controller, encoder) {
      if (isAIMessageChunk(event.data.chunk)) {
        const aiMessageChunk = event.data.chunk as AIMessageChunk
        if (aiMessageChunk.content.length) {
          const content = aiMessageChunk.content as string
          const part = formatDataStreamPart('text', content)
          controller.enqueue(encoder.encode(part))
        }
      }
    },

    handleToolEnd(event, controller, encoder) {
      if (event.tags.includes(ImageSearchToolTag.ImageSearch) || event.tags.includes(WeatherToolTags.WeatherSearch)) {
        consola.debug({ tag: 'streamHandlers', message: 'Handling image search or weather search' })
        const toolMessage = event.data.output as ToolMessage
        const html = toolMessage.artifact
        if (html && html.length) {
          const text = formatDataStreamPart('text', html)
          controller.enqueue(encoder.encode(text))
        }
      }
      if (event.data.output && (event.data.output as ToolMessage).content.length) {
        const content = (event.data.output as ToolMessage).content as string

        const toolOutputTypes = {
          [WeatherToolTags.WeatherSearch]: DataItemTypes.Weather,
          [HotelToolTags.HotelSearch]: DataItemTypes.HotelSearch,
          [SightseeingToolTags.SightSearch]: DataItemTypes.SightSearch,
          [TravelRecommendToolTags.SearchQuery]: DataItemTypes.SearchQuery,
          [TravelRecommendToolTags.SearchExecution]: DataItemTypes.SearchExecution,
          [TravelRecommendToolTags.SearchSummary]: DataItemTypes.SearchSummary,
          [TransferToolTags.HotelTransfer]: DataItemTypes.TransferToHotel,
          [TransferToolTags.SightseeingTransfer]: DataItemTypes.TransferToSights,
          [TransferToolTags.TravelTransfer]: DataItemTypes.TransferToTravel,
          [TransferToolTags.WeatherTransfer]: DataItemTypes.TransferToWeather,
        }

        for (const [tag, type] of Object.entries(toolOutputTypes)) {
          if (event.tags.includes(tag)) {
            const id = uuidv4()
            if (content.length && !content.includes('*Error*')) {
              const part = `2:[{"id":"${id}","type":"${type}","data":${content}}]\n`
              controller.enqueue(part)
            }
            break
          }
        }
      }
    },
  }
}
