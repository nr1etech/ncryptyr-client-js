import {Account, ApiKeyWithSecret, EncryptionKeyType} from './types';

export interface EncryptionKey {
  readonly accountId: string;
  readonly id: string;
  readonly type: EncryptionKeyType;
  // readonly createdDate: number;
}

export interface EncryptionKeyExport {
  readonly accountId: string;
  readonly id: string;
  readonly type: EncryptionKeyType;
  // readonly createdDate: number;
  readonly version: number;
  readonly key: string;
  readonly iv: string;
}

export interface EnrollCommand {
  readonly id: string;
  readonly contact: {
    readonly name: string;
    readonly email: string;
  };
}

export interface EnrollCommandOutput {
  readonly account: Account;
  readonly apiKey: ApiKeyWithSecret;
}

export interface DescribeAccountCommand {
  readonly id?: string;
}

export interface ListAccountsCommand {
  readonly idBeginsWith?: string;
}

export interface ListAccountsCommandOutput {
  readonly accounts: Account[];
}

export interface UpdateAccountCommand {
  readonly id?: string;
  readonly contact?: {
    readonly name?: string;
    readonly email?: string;
  };
}

export interface DeleteAccountCommand {
  readonly id: string;
}

export interface CreateApiKeyCommand {
  readonly id: string;
}

export interface ListApiKeysCommand {
  readonly idBeginsWith?: string;
}

export interface DeleteApiKeyCommand {
  readonly id: string;
}

export interface CreateEncryptionKeyCommand {
  readonly id: string;
}

export interface DescribeEncryptionKeyCommand {
  readonly id: string;
}

export interface ExportEncryptionKeyCommand {
  readonly id: string;
}

export interface ListEncryptionKeysCommand {
  readonly idBeginsWith?: string;
}

export interface DeleteEncryptionKeyCommand {
  readonly id: string;
}
