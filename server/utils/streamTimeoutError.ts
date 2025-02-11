export class StreamTimeoutError extends Error {
  constructor(message: string = 'Stream timeout') {
    super(message)
    this.name = 'StreamTimeoutError'
  }
}
