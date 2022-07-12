export interface Contact {
  readonly name: string;
  readonly email: string;
}

export interface CreateAccountRequest {
  readonly id: string;
  readonly contact: Contact;
}

export interface CreateAccountResponse {
  readonly id: string;
  readonly contact: Contact;
}
