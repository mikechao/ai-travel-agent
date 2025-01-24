// just a simple test endpoint that will return
// a message that contains some stuff in message.annotations
export default defineLazyEventHandler(async () => {
  return defineEventHandler(async (_webEvent) => {
    return new ReadableStream({
      async start(controller) {
        controller.enqueue(`8:[{"type":"weather"}]\n`)
        controller.close()
      },
    })
  })
})
