import { formatDataStreamPart } from 'ai'

// just a simple test endpoint that will return some text
export default defineLazyEventHandler(async () => {
  const text1 = `
Two roads diverged in a yellow wood,<br/>
And sorry I could not travel both<br/>
And be one traveler, long I stood<br/>
And looked down one as far as I could<br/>
To where it bent in the undergrowth;<br/>
<br/>
The poem should be above weather data.<br/>
<br/>
`

  const text2 = `
<br/>
The weather data should be above this poem<br/>
Is this the last time I’ll admire the guys<br/>
in their neon-yellow slickers, guiding us<br/>
to our parking spots before we head up<br/>
 <br/>
two flights to the passenger deck,<br/>
to the cafeteria where a man in a black derby<br/>
and black suspenders nods and smiles<br/>
 <br/>
`
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  const encoder = new TextEncoder()
  return defineEventHandler(async (_webEvent) => {
    return new ReadableStream({
      async start(controller) {
        for (const chunk of text1.split(' ')) {
          // simluate some delay
          await delay(50)
          const part = formatDataStreamPart('text', chunk)
          controller.enqueue(encoder.encode(part))
        }
        for (const chunk of text2.split(' ')) {
          // simluate some delay
          await delay(50)
          const part = formatDataStreamPart('text', chunk)
          controller.enqueue(encoder.encode(part))
        }
        controller.close() // Close the stream when done
      },
    })
  })
})
