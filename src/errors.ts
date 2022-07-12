export class ValidationError extends Error {

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class BadRequestError extends Error {

  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export class ForbiddenError extends Error {

  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {

  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class InternalServerError extends Error {

  constructor(message: string) {
    super(message);
    this.name = "InternalServerError";
  }
}
