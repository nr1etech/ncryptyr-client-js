import {ObjectSchema} from 'joi';
import {ValidationError} from '@nr1e/commons/errors';

export function validate(body: unknown, schema: ObjectSchema) {
  console.log('OINK');
  const result = schema.validate(body);
  console.log('MOOO', result);
  if (result.error) {
    throw new ValidationError(result.error.message);
  }
}
