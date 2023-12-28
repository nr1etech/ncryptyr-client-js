import {ObjectSchema} from 'joi';
import {ValidationError} from '@nr1e/commons/errors';

export function validate(body: unknown, schema: ObjectSchema) {
  const result = schema.validate(body);
  if (result.error) {
    throw new ValidationError(result.error.message);
  }
}
