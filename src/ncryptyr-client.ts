import {HttpClient, HttpResponse} from "./http-client";
import {CreateAccountRequest, CreateAccountResponse} from "./types";
import {BadRequestError, ForbiddenError, InternalServerError, NotFoundError} from "./errors";
import * as fs from "fs";

const DEFAULT_BASE_URL = "https://api.ncryptyr.conm";
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
    return fs.existsSync(CONFIG_FILE_NAME) ? JSON.parse(fs.readFileSync(CONFIG_FILE_NAME, UTF8)) : {};
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
    if (res.status() === 400) {
      throw new BadRequestError(message);
    }
    if (res.status() === 404) {
      throw new NotFoundError(message);
    }
    if (res.status() === 403) {
      throw new ForbiddenError(message);
    }
    if (res.status() === 500) {
      throw new InternalServerError(message);
    }
    throw Error(message);
  }

  async createAccount(req: CreateAccountRequest): Promise<CreateAccountResponse> {
    const res = await this.client.request("/accounts").post().json(req).send();
    if (res.success()) {
      return await res.json();
    }
    await this.processFailure(res);
  }
}
