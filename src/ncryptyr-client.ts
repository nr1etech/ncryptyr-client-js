import {HttpClient, HttpResponse} from './http-client';
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from '@nr1e/commons/errors';
import {
  CreateApiKeyCommand,
  CreateEncryptionKeyCommand,
  DeleteAccountCommand,
  DeleteApiKeyCommand,
  DeleteEncryptionKeyCommand,
  DescribeAccountCommand,
  EncryptionKey,
  EncryptionKeyExport,
  ExportEncryptionKeyCommand,
  ListAccountsCommand,
  ListAccountsCommandOutput,
  ListApiKeysCommand,
  ListEncryptionKeysCommand,
  UpdateAccountCommand,
} from './old-types';
import {ContentType} from './content-type';
import {
  Account,
  ApiKey,
  ApiKeyWithSecret,
  CREATE_ACCOUNT_V1_INPUT,
  CreateAccountInput,
  CreateAccountOutput,
  UPDATE_ACCOUNT_V1_INPUT,
  UpdateAccountInput,
  UpdateAccountOutput,
} from './types';
import axios from 'axios';
import {HttpStatusCode} from '@nr1e/commons/http';

const DEFAULT_BASE_URL = 'https://api.ncryptyr.com';
const USER_AGENT = 'ncryptyr-client';

interface IErrorMessage {
  message?: string;
}

function isErrorMessage(error?: IErrorMessage): error is IErrorMessage {
  return error !== undefined && error.message !== undefined;
}

export interface NcryptyrClientProps {
  readonly baseUrl?: string;
  readonly apiKey?: string;
}

export class NcryptyrClient {
  readonly baseUrl: string;
  protected oldClient: HttpClient;
  protected client = axios.create();
  protected logErrorResponses = false;

  constructor(props?: NcryptyrClientProps) {
    this.baseUrl = props?.baseUrl ?? DEFAULT_BASE_URL;
    this.oldClient = new HttpClient(this.baseUrl);
    this.client.interceptors.request.use(
      config => {
        config.headers['user-agent'] = USER_AGENT;
        if (config.data !== undefined) {
          config.headers['content-type'] = 'application/json';
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    if (props?.apiKey) {
      this.apiKey(props.apiKey);
    }
  }

  apiKey(secret: string): NcryptyrClient {
    this.oldClient.apiKey(secret);
    this.client.interceptors.request.use(
      config => {
        config.headers['api-key'] = secret;
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    return this;
  }

  logRequests(): NcryptyrClient {
    this.client.interceptors.request.use(
      config => {
        console.log('Request', config);
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    return this;
  }

  logResponses(): NcryptyrClient {
    this.client.interceptors.response.use(
      config => {
        console.log('Response', config);
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
    this.logErrorResponses = true;
    return this;
  }

  protected processError(error: unknown): unknown {
    if (error && axios.isAxiosError(error)) {
      if (this.logErrorResponses && error.response) {
        console.log('Error', error.response);
      }
      if (error.response && isErrorMessage(error.response?.data)) {
        const message = error.response.data.message;
        switch (error.response.status) {
          case HttpStatusCode.INTERNAL_SERVER_ERROR:
            return new InternalServerError(message);
          case HttpStatusCode.NOT_FOUND:
            return new NotFoundError(message);
          case HttpStatusCode.BAD_REQUEST:
            return new BadRequestError(message);
          case HttpStatusCode.FORBIDDEN:
            return new ForbiddenError(message);
        }
        return new Error(message);
      }
    }
    return error;
  }

  async createAccount(input: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const response = await this.client.post<CreateAccountOutput>(
        `${this.baseUrl}/accounts`,
        input,
        {
          headers: {
            'content-type': CREATE_ACCOUNT_V1_INPUT,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.processError(error);
    }
  }

  async updateAccount(input: UpdateAccountInput): Promise<UpdateAccountOutput> {
    try {
      const response = await this.client.put<UpdateAccountOutput>(
        `${this.baseUrl}/accounts/${input.id}`,
        input,
        {
          headers: {
            'content-type': UPDATE_ACCOUNT_V1_INPUT,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw this.processError(error);
    }
  }

  async getAccount(accountId?: string): Promise<Account> {
    try {
      const response = await this.client.get<Account>(
        `${this.baseUrl}/accounts/${accountId ?? 'self'}`
      );
      return response.data;
    } catch (error) {
      throw this.processError(error);
    }
  }

  // OLD ////////////////////////////////////////////////////////////////////////////

  protected async processFailureOld(res: HttpResponse): Promise<Error> {
    let message = res.statusText();
    try {
      const content = await res.json<Object>();
      if ('message' in content) {
        message = content.message as string;
      }
    } catch (error) {
      // Ignore
    }
    if (res.status() === HttpStatusCode.BAD_REQUEST) {
      return new BadRequestError(message);
    }
    if (res.status() === HttpStatusCode.NOT_FOUND) {
      return new NotFoundError(message);
    }
    if (res.status() === HttpStatusCode.FORBIDDEN) {
      return new ForbiddenError(message);
    }
    if (res.status() === HttpStatusCode.INTERNAL_SERVER_ERROR) {
      return new InternalServerError(message);
    }
    return Error(message);
  }

  protected async withOutput<O extends Object>(
    output: Promise<O | null>
  ): Promise<O> {
    const result = await output;
    if (result === null) {
      throw new Error('Expected output');
    }
    return result;
  }

  protected async sendCommand<C extends Object, O extends Object>(
    command: C,
    authRequired: boolean,
    contentType: ContentType,
    expectedContentType?: ContentType
  ): Promise<O | null> {
    const res = await this.oldClient
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
      if (res.status() === HttpStatusCode.NO_CONTENT) {
        return null;
      }
      return await res.json();
    }
    throw await this.processFailureOld(res);
  }

  async describeAccount(command?: DescribeAccountCommand): Promise<Account> {
    return await this.withOutput(
      this.sendCommand(
        command ?? {},
        true,
        ContentType.DESCRIBE_ACCOUNT_V1,
        ContentType.DESCRIBE_ACCOUNT_V1_RESPONSE
      )
    );
  }

  async listAccounts(
    command?: ListAccountsCommand
  ): Promise<ListAccountsCommandOutput> {
    return await this.withOutput(
      this.sendCommand(
        command ?? {},
        true,
        ContentType.LIST_ACCOUNTS_V1,
        ContentType.LIST_ACCOUNTS_V1_RESPONSE
      )
    );
  }

  async updateAccountOld(command: UpdateAccountCommand): Promise<Account> {
    return await this.withOutput(
      this.sendCommand(
        command,
        true,
        ContentType.UPDATE_ACCOUNT_V1,
        ContentType.UPDATE_ACCOUNT_V1_RESPONSE
      )
    );
  }

  async deleteAccount(command: DeleteAccountCommand): Promise<void> {
    await this.sendCommand(command, true, ContentType.DELETE_ACCOUNT_V1);
    return;
  }

  async createApiKey(command: CreateApiKeyCommand): Promise<ApiKeyWithSecret> {
    return await this.withOutput(
      this.sendCommand(
        command,
        true,
        ContentType.CREATE_API_KEY_V1,
        ContentType.CREATE_API_KEY_V1_RESPONSE
      )
    );
  }

  async listApiKeys(command?: ListApiKeysCommand): Promise<ApiKey[]> {
    return await this.withOutput(
      this.sendCommand(
        command ?? {},
        true,
        ContentType.LIST_API_KEYS_V1,
        ContentType.LIST_API_KEYS_V1_RESPONSE
      )
    );
  }

  async deleteApiKey(command: DeleteApiKeyCommand): Promise<void> {
    await this.sendCommand(command, true, ContentType.DELETE_API_KEY_V1);
    return;
  }

  async createEncryptionKey(
    command: CreateEncryptionKeyCommand
  ): Promise<EncryptionKey> {
    return await this.withOutput(
      this.sendCommand(
        command,
        true,
        ContentType.CREATE_ENCRYPTION_KEY_V1,
        ContentType.CREATE_ENCRYPTION_KEY_V1_RESPONSE
      )
    );
  }

  async describeEncryptionKey(
    command: CreateEncryptionKeyCommand
  ): Promise<EncryptionKey> {
    return await this.withOutput(
      this.sendCommand(
        command,
        true,
        ContentType.DESCRIBE_ENCRYPTION_KEY_V1,
        ContentType.DESCRIBE_ENCRYPTION_KEY_V1_RESPONSE
      )
    );
  }

  async exportEncryptionKey(
    command: ExportEncryptionKeyCommand
  ): Promise<EncryptionKeyExport> {
    return await this.withOutput(
      this.sendCommand(
        command,
        true,
        ContentType.EXPORT_ENCRYPTION_KEY_V1,
        ContentType.EXPORT_ENCRYPTION_KEY_V1_RESPONSE
      )
    );
  }

  async listEncryptionKeys(
    command?: ListEncryptionKeysCommand
  ): Promise<EncryptionKey[]> {
    return await this.withOutput(
      this.sendCommand(
        command ?? {},
        true,
        ContentType.LIST_ENCRYPTION_KEYS_V1,
        ContentType.LIST_ENCRYPTION_KEYS_V1_RESPONSE
      )
    );
  }

  async deleteEncryptionKey(
    command: DeleteEncryptionKeyCommand
  ): Promise<void> {
    await this.sendCommand(command, true, ContentType.DELETE_ENCRYPTION_KEY_V1);
    return;
  }

  async encrypt(encryptionKeyId: string, data: string): Promise<string> {
    const res = await this.oldClient
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
    throw await this.processFailureOld(res);
  }

  async decrypt(ciphertext: string): Promise<string> {
    const res = await this.oldClient
      .userAgent(USER_AGENT)
      .request('/decrypt')
      .authRequired()
      .post()
      .text(ciphertext)
      .send();
    if (res.success()) {
      return await res.text();
    }
    throw await this.processFailureOld(res);
  }
}
