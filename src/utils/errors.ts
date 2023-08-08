export function isErrorMessage(error: unknown): error is Error {
  return error instanceof Error && 'message' in error
}
