export enum EncryptionKeyType {
  AES_128 = 'AES-128',
}

export interface ApiKey {
  readonly accountId: string;
  readonly id: string;
  readonly createdDate: number;
}

export interface ApiKeyWithSecret extends ApiKey {
  readonly secret: string;
}
