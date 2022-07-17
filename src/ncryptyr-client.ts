import {HttpClient, HttpResponse, StatusCode} from "./http-client";
import {BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from "./errors";
import * as fs from "fs";
import path = require("path");
import os = require("os");
import {
  Account,
  ApiKey, ApiKeyWithSecret,
  CreateApiKeyCommand,
  CreateEncryptionKeyCommand,
  DeleteAccountCommand,
  DeleteApiKeyCommand,
  DeleteEncryptionKeyCommand,
  DescribeAccountCommand,
  EncryptionKey,
  EncryptionKeyExport,
  EnrollCommand, EnrollCommandOutput,
  ExportEncryptionKeyCommand,
  ListAccountsCommand,
  ListAccountsCommandOutput,
  ListApiKeysCommand,
  ListEncryptionKeysCommand,
  UpdateAccountCommand
} from "./types";
import {ContentType} from "./content-type";

const DEFAULT_BASE_URL = "https://api.ncryptyr.conm";
const USER_AGENT = "ncryptyr-client";
const CONFIG_FILE_NAME = "ncryptyr.json";
const UTF8 = "utf-8";

export class NcryptyrClientConfig {
  readonly baseUrl?: string;
  readonly apiKey?: string;
}

export class NcryptyrClient {

  readonly baseUrl: string;
  protected client: HttpClient;

  protected readConfigFile(): NcryptyrClientConfig {
    let file = undefined;
    // Find config file in current and parent directories
    let currentPath = __dirname
    for (let p of path.join(__dirname).normalize().split(path.sep)) {
      currentPath = path.join(currentPath, "..").normalize();
      if (fs.existsSync(path.join(currentPath, CONFIG_FILE_NAME))) {
        file = path.join(currentPath, CONFIG_FILE_NAME);
      }
    }

    // Find config file in home directory
    if (file === undefined && fs.existsSync(path.join(os.homedir(), CONFIG_FILE_NAME))) {
      file = path.join(os.homedir(), CONFIG_FILE_NAME);
    }

    // Find config file in /etc
    if (file == undefined && fs.existsSync(path.join("/etc", CONFIG_FILE_NAME))) {
      file = path.join("/etc", CONFIG_FILE_NAME);
    }

    return file !== undefined ? JSON.parse(fs.readFileSync(file, UTF8)) : {};
  }

  constructor(baseUrl?: string) {
    const configFile = this.readConfigFile();

    if (baseUrl !== undefined) {
      this.client = new HttpClient(baseUrl);
    } else if (process.env.NCRYPTYR_BASE_URL !== undefined) {
      this.client = new HttpClient(process.env.NCRYPTYR_BASE_URL);
    } else if (configFile.baseUrl !== undefined) {
      this.client = new HttpClient(configFile.baseUrl);
    } else {
      this.client = new HttpClient(DEFAULT_BASE_URL);
    }
    this.baseUrl = this.client.baseUrl;

    if (process.env.NCRYPTYR_API_KEY !== undefined) {
      this.client.apiKey(process.env.NCRYPTYR_API_KEY);
    } else if (configFile.apiKey !== undefined) {
      this.client.apiKey(configFile.apiKey);
    }
  }

  apiKey(secret: string): NcryptyrClient {
    this.client.apiKey(secret);
    return this;
  }

  protected async processFailure(res: HttpResponse) {
    let message = res.statusText();
    try {
      let content = await res.json();
      if ("message" in content) {
        message = content.message;
      }
    } catch (error) {}
    if (res.status() === StatusCode.BAD_REQUEST) {
      throw new BadRequestError(message);
    }
    if (res.status() === StatusCode.NOT_FOUND) {
      throw new NotFoundError(message);
    }
    if (res.status() === StatusCode.FORBIDDEN) {
      throw new ForbiddenError(message);
    }
    if (res.status() === StatusCode.INTERNAL_ERROR) {
      throw new InternalServerError(message);
    }
    throw Error(message);
  }

  protected async sendCommand(command: any, authRequired: boolean, contentType: ContentType, expectedContentType?: ContentType): Promise<any> {
    const res = await this.client.userAgent(USER_AGENT).request("/").authRequired(authRequired).post().json(command, contentType).send();
    if (res.success()) {
      if (expectedContentType !== undefined && expectedContentType !== res.contentType()) {
        throw new Error(`Expected content type ${expectedContentType} and received ${res.contentType()}`);
      }
      return res.status() === StatusCode.NO_CONTENT ? undefined : await res.json();
    }
    await this.processFailure(res);
  }

  async enroll(command: EnrollCommand): Promise<EnrollCommandOutput> {
    return await this.sendCommand(command, false, ContentType.ENROLL_V1, ContentType.ENROLL_V1_RESPONSE);
  }

  async describeAccount(command?: DescribeAccountCommand): Promise<Account> {
    return await this.sendCommand(command ?? {}, true, ContentType.DESCRIBE_ACCOUNT_V1, ContentType.DESCRIBE_ACCOUNT_V1_RESPONSE);
  }

  async listAccounts(command?: ListAccountsCommand): Promise<ListAccountsCommandOutput> {
    return await this.sendCommand(command ?? {}, true, ContentType.LIST_ACCOUNTS_V1, ContentType.LIST_ACCOUNTS_V1_RESPONSE);
  }

  async updateAccount(command: UpdateAccountCommand): Promise<Account> {
    return await this.sendCommand(command, true, ContentType.UPDATE_ACCOUNT_V1, ContentType.UPDATE_ACCOUNT_V1_RESPONSE);
  }

  async deleteAccount(command: DeleteAccountCommand): Promise<void> {
    return await this.sendCommand(command, true, ContentType.DELETE_ACCOUNT_V1);
  }

  async createApiKey(command: CreateApiKeyCommand): Promise<ApiKeyWithSecret> {
    return await this.sendCommand(command, true, ContentType.CREATE_API_KEY_V1, ContentType.CREATE_API_KEY_V1_RESPONSE);
  }

  async listApiKeys(command?: ListApiKeysCommand): Promise<ApiKey[]> {
    return await this.sendCommand(command ?? {}, true, ContentType.LIST_API_KEYS_V1, ContentType.LIST_API_KEYS_V1_RESPONSE);
  }

  async deleteApiKey(command: DeleteApiKeyCommand): Promise<void> {
    return await this.sendCommand(command, true, ContentType.DELETE_API_KEY_V1);
  }

  async createEncryptionKey(command: CreateEncryptionKeyCommand): Promise<EncryptionKey> {
    return await this.sendCommand(command, true, ContentType.CREATE_ENCRYPTION_KEY_V1, ContentType.CREATE_ENCRYPTION_KEY_V1_RESPONSE);
  }

  async describeEncryptionKey(command: CreateEncryptionKeyCommand): Promise<EncryptionKey> {
    return await this.sendCommand(command, true, ContentType.DESCRIBE_ENCRYPTION_KEY_V1, ContentType.DESCRIBE_ENCRYPTION_KEY_V1_RESPONSE);
  }

  async exportEncryptionKey(command: ExportEncryptionKeyCommand): Promise<EncryptionKeyExport> {
    return await this.sendCommand(command, true, ContentType.EXPORT_ENCRYPTION_KEY_V1, ContentType.EXPORT_ENCRYPTION_KEY_V1_RESPONSE);
  }

  async listEncryptionKeys(command?: ListEncryptionKeysCommand): Promise<EncryptionKey[]> {
    return await this.sendCommand(command ?? {}, true, ContentType.LIST_ENCRYPTION_KEYS_V1, ContentType.LIST_ENCRYPTION_KEYS_V1_RESPONSE);
  }

  async deleteEncryptionKey(command: DeleteEncryptionKeyCommand): Promise<void> {
    return await this.sendCommand(command, true, ContentType.DELETE_ENCRYPTION_KEY_V1);
  }
}
