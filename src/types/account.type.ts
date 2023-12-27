import {ApiKeyWithSecret} from './api-key.type';
import * as joi from 'joi';

export const ACCOUNT_ID_REGEX = /[a-z][0-9a-z/]+/;
export const ACCOUNT_ID_MAX_LENGTH = 64;
export const ACCOUNT_ID_MIN_LENGTH = 4;
export const ACCOUNT_ID_SCHEMA = joi
  .string()
  .min(ACCOUNT_ID_MIN_LENGTH)
  .max(ACCOUNT_ID_MAX_LENGTH)
  .regex(ACCOUNT_ID_REGEX);
export const CONTACT_NAME_MAX_LENGTH = 64;
export const CONTACT_NAME_MIN_LENGTH = 2;
export const CONTACT_NAME_SCHEMA = joi
  .string()
  .min(CONTACT_NAME_MIN_LENGTH)
  .max(CONTACT_NAME_MAX_LENGTH);

export interface Contact {
  readonly name: string;
  readonly email: string;
}

export interface Account {
  readonly id: string;
  readonly contact: Contact;
  readonly createdDate: number;
}

export interface CreateAccountInput {
  readonly id: string;
  readonly contact: Contact;
}

export const CREATE_ACCOUNT_INPUT_SCHEMA = joi.object({
  id: ACCOUNT_ID_SCHEMA.required(),
  contact: joi.object({
    name: CONTACT_NAME_SCHEMA.required(),
    email: joi.string().email().required(),
  }),
});

export const CREATE_ACCOUNT_V1_REQUEST =
  'application/vnd.ncryptyr.create-account-request.v1+json';
export const CREATE_ACCOUNT_V1_RESPONSE =
  'application/vnd.ncryptyr.create-account-response.v1+json';

export interface CreateAccountOutput {
  readonly account: Account;
  readonly apiKey: ApiKeyWithSecret;
}
