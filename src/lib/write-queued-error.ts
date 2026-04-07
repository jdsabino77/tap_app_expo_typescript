/** Thrown when a mutation was stored locally and will sync when online. */
export class WriteQueuedError extends Error {
  readonly name = "WriteQueuedError";

  constructor(
    message = "Saved on this device. It will sync to the server when you are back online.",
  ) {
    super(message);
  }
}

export function isWriteQueuedError(e: unknown): e is WriteQueuedError {
  return e instanceof WriteQueuedError;
}
