import {HttpClient, HttpResponse, StatusCode} from './http-client';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from './errors';
import {
  Account,
  ApiKey,
  ApiKeyWithSecret,
  CreateApiKeyCommand,
  CreateEncryptionKeyCommand,
  DeleteAccountCommand,
  DeleteApiKeyCommand,
  DeleteEncryptionKeyCommand,
  DescribeAccountCommand,
  EncryptionKey,
  EncryptionKeyExport,
  EnrollCommand,
  EnrollCommandOutput,
  ExportEncryptionKeyCommand,
  ListAccountsCommand,
  ListAccountsCommandOutput,
  ListApiKeysCommand,
  ListEncryptionKeysCommand,
  UpdateAccountCommand,
} from './types';
import {ContentType} from './content-type';

const DEFAULT_BASE_URL = 'https://api.ncryptyr.com';
const USER_AGENT = 'ncryptyr-client';

export interface NcryptyrClientProps {
  readonly baseUrl?: string;
  readonly apiKey?: string;
}

export class NcryptyrClient {
  readonly baseUrl: string;
  protected client: HttpClient;

  constructor(props?: NcryptyrClientProps) {
    this.baseUrl = props?.baseUrl ?? DEFAULT_BASE_URL;
    this.client = new HttpClient(this.baseUrl).apiKey(props?.apiKey);
  }

  apiKey(secret: string): NcryptyrClient {
    this.client.apiKey(secret);
    return this;
  }

  protected async processFailure(res: HttpResponse): Promise<Error> {
    let message = res.statusText();
    try {
      const content = await res.json();
      if ('message' in content) {
        message = content.message;
      }
    } catch (error) {
      // Ignore
    }
    if (res.status() === StatusCode.BAD_REQUEST) {
      return new BadRequestError(message);
    }
    if (res.status() === StatusCode.NOT_FOUND) {
      return new NotFoundError(message);
    }
    if (res.status() === StatusCode.FORBIDDEN) {
      return new ForbiddenError(message);
    }
    if (res.status() === StatusCode.INTERNAL_ERROR) {
      return new InternalServerError(message);
    }
    return Error(message);
  }

  protected async sendCommand(
    command: any,
    authRequired: boolean,
    contentType: ContentType,
    expectedContentType?: ContentType
  ): Promise<any> {
    const res = await this.client
      .userAgent(USER_AGENT)
      .request('/')
      .authRequired(authRequired)
      .post()
      .json(command, contentType)
      .send();
    if (res.success()) {
      if (
        expectedContentType !== undefined &&
        expectedContentType !== res.contentType()
      ) {
        throw new Error(
          `Expected content type ${expectedContentType} and received ${res.contentType()}`
        );
      }
      return res.status() === StatusCode.NO_CONTENT
        ? undefined
        : await res.json();
    }
    throw await this.processFailure(res);
  }

  async enroll(command: EnrollCommand): Promise<EnrollCommandOutput> {
    return await this.sendCommand(
      command,
      false,
      ContentType.ENROLL_V1,
      ContentType.ENROLL_V1_RESPONSE
    );
  }

  async describeAccount(command?: DescribeAccountCommand): Promise<Account> {
    return await this.sendCommand(
      command ?? {},
      true,
      ContentType.DESCRIBE_ACCOUNT_V1,
      ContentType.DESCRIBE_ACCOUNT_V1_RESPONSE
    );
  }

  async listAccounts(
    command?: ListAccountsCommand
  ): Promise<ListAccountsCommandOutput> {
    return await this.sendCommand(
      command ?? {},
      true,
      ContentType.LIST_ACCOUNTS_V1,
      ContentType.LIST_ACCOUNTS_V1_RESPONSE
    );
  }

  async updateAccount(command: UpdateAccountCommand): Promise<Account> {
    return await this.sendCommand(
      command,
      true,
      ContentType.UPDATE_ACCOUNT_V1,
      ContentType.UPDATE_ACCOUNT_V1_RESPONSE
    );
  }

  async deleteAccount(command: DeleteAccountCommand): Promise<void> {
    return await this.sendCommand(command, true, ContentType.DELETE_ACCOUNT_V1);
  }

  async createApiKey(command: CreateApiKeyCommand): Promise<ApiKeyWithSecret> {
    return await this.sendCommand(
      command,
      true,
      ContentType.CREATE_API_KEY_V1,
      ContentType.CREATE_API_KEY_V1_RESPONSE
    );
  }

  async listApiKeys(command?: ListApiKeysCommand): Promise<ApiKey[]> {
    return await this.sendCommand(
      command ?? {},
      true,
      ContentType.LIST_API_KEYS_V1,
      ContentType.LIST_API_KEYS_V1_RESPONSE
    );
  }

  async deleteApiKey(command: DeleteApiKeyCommand): Promise<void> {
    return await this.sendCommand(command, true, ContentType.DELETE_API_KEY_V1);
  }

  async createEncryptionKey(
    command: CreateEncryptionKeyCommand
  ): Promise<EncryptionKey> {
    return await this.sendCommand(
      command,
      true,
      ContentType.CREATE_ENCRYPTION_KEY_V1,
      ContentType.CREATE_ENCRYPTION_KEY_V1_RESPONSE
    );
  }

  async describeEncryptionKey(
    command: CreateEncryptionKeyCommand
  ): Promise<EncryptionKey> {
    return await this.sendCommand(
      command,
      true,
      ContentType.DESCRIBE_ENCRYPTION_KEY_V1,
      ContentType.DESCRIBE_ENCRYPTION_KEY_V1_RESPONSE
    );
  }

  async exportEncryptionKey(
    command: ExportEncryptionKeyCommand
  ): Promise<EncryptionKeyExport> {
    return await this.sendCommand(
      command,
      true,
      ContentType.EXPORT_ENCRYPTION_KEY_V1,
      ContentType.EXPORT_ENCRYPTION_KEY_V1_RESPONSE
    );
  }

  async listEncryptionKeys(
    command?: ListEncryptionKeysCommand
  ): Promise<EncryptionKey[]> {
    return await this.sendCommand(
      command ?? {},
      true,
      ContentType.LIST_ENCRYPTION_KEYS_V1,
      ContentType.LIST_ENCRYPTION_KEYS_V1_RESPONSE
    );
  }

  async deleteEncryptionKey(
    command: DeleteEncryptionKeyCommand
  ): Promise<void> {
    return await this.sendCommand(
      command,
      true,
      ContentType.DELETE_ENCRYPTION_KEY_V1
    );
  }

  async encrypt(encryptionKeyId: string, data: string): Promise<string> {
    const res = await this.client
      .userAgent(USER_AGENT)
      .request('/encrypt')
      .header('Encryption-Key', encryptionKeyId)
      .authRequired()
      .post()
      .text(data)
      .send();
    if (res.success()) {
      return await res.text();
    }
    throw await this.processFailure(res);
  }

  async decrypt(ciphertext: string): Promise<string> {
    const res = await this.client
      .userAgent(USER_AGENT)
      .request('/decrypt')
      .authRequired()
      .post()
      .text(ciphertext)
      .send();
    if (res.success()) {
      return await res.text();
    }
    throw await this.processFailure(res);
  }
}
