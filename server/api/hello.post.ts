import { formatDataStreamPart } from "ai"

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const { messages } = body

  console.log('Received request:', messages)

  const part1 = formatDataStreamPart('text', 'Hello, ')
  const part2 = formatDataStreamPart('text', 'World!, ')
  const part3 = formatDataStreamPart('text', 'banana, ')

  const parts = [part1, part2, part3]

  const encoder = new TextEncoder()
  const values = parts.map(p => encoder.encode(p))

  return new ReadableStream({
    start(controller) {
      try {
        for (const value of values) {
          controller.enqueue(value);
        }
      } finally {
        controller.close();
      }
    },
  })
})