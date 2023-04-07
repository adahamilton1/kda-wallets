const UNIMPLEMENTED_MESSAGE = "unimplemented"

export class UnimplementedError extends Error {
  constructor() {
    super(UNIMPLEMENTED_MESSAGE);
  }
}

/**
 * 
 * @param {Error} e
 * @returns {e is UnimplementedError} 
 */
export function isUnimplementedError(e) {
  return e.message === UNIMPLEMENTED_MESSAGE;
}
