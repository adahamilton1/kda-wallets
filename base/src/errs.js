const UNIMPLEMENTED_STR = /** @type {const} */ ("unimplemented");
export class UnimplementedError extends Error {
  constructor() {
    super(UNIMPLEMENTED_STR);
  }
}
