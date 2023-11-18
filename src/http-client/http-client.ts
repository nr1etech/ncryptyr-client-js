import { URLSearchParams } from "url";
import fetch from "node-fetch";
import {StatusCode} from "./status-code";

type Headers = Record<string, string>;
type Parameters = Record<string, string>;

export class HttpClient {

  readonly baseUrl: string;
  readonly commonHeaders: Headers;
  readonly authHeaders: Headers;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.commonHeaders = {};
    this.authHeaders = {};
  }

  userAgent(userAgent: string): HttpClient {
    this.commonHeaders["User-Agent"] = userAgent;
    return this;
  }

  apiKey(secret: string): HttpClient {
    if (secret) {
      // TODO Review this
      // if (Object.keys(this.authHeaders).length > 0) {
      //   throw Error("Authentication method is already set");
      // }
      this.authHeaders["Api-Key"] = secret;
    }
    return this;
  }

  accessToken(accessToken: string): HttpClient {
    if (Object.keys(this.authHeaders).length > 0) {
      throw Error("Authentication method is already set");
    }
    this.authHeaders["Authorization"] = `Bearer ${accessToken}`;
    return this;
  }

  request(path: string): HttpRequest {
    return new HttpRequest(this, path);
  }
}

export class HttpRequest {

  readonly client: HttpClient;
  path: string;
  headers: Headers;

  constructor(client: HttpClient, path: string) {
    this.client = client;
    this.path = path;
    this.headers = {...client.commonHeaders};
  }

  expandPath(paramName: string, paramValue: string): HttpRequest {
    this.path = this.path.replace(`{${paramName}}`, paramValue);
    return this;
  }

  authRequired(authRequired?: boolean): HttpRequest {
    if (authRequired === undefined || authRequired) {
      this.headers = {
        ...this.headers,
        ...this.client.authHeaders
      }
      // this.headers = {...this.client.commonHeaders, ...this.client.authHeaders};
    }
    return this;
  }

  header(name: string, value: string): HttpRequest {
    this.headers[name] = value;
    return this;
  }

  get(): HttpGetRequest {
    return new HttpGetRequest(this);
  }

  post(): HttpPostRequest {
    return new HttpPostRequest(this);
  }
}

export class HttpGetRequest {

  readonly request: HttpRequest;
  parameters: Parameters;


  constructor(request: HttpRequest) {
    this.request = request;
    this.parameters = {};
  }

  parameter(name: string | undefined, value: string | undefined): HttpGetRequest {
    if (value !== undefined && name !== undefined) {
      this.parameters[name] = value;
    }
    return this;
  }

  async send(): Promise<HttpResponse> {
    let url = this.request.client.baseUrl + this.request.path;
    if (Object.keys(this.parameters).length > 0) {
      url = url + "?" + new URLSearchParams(this.parameters);
    }
    const res = await fetch(url, {
      method: "GET",
      headers: this.request.headers
    });
    return new HttpResponse(res);
  }
}

export class HttpPostRequest {

  readonly request: HttpRequest;
  headers: Headers;
  parameters: Parameters;
  body: string | object;

  constructor(request: HttpRequest) {
    this.request = request;
    this.headers = {
      ...request.headers
    }
  }

  formData(name: string, value: string): HttpPostRequest {
    if (this.body !== undefined) {
      throw new Error("Body already set");
    }
    if (this.parameters === undefined) {
      this.parameters = {}
    }
    this.parameters[name] = value;
    if (!("Content-Type" in this.headers)) {
      this.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    return this;
  }

  json(body: string | object, contentType?: string): HttpPostRequest {
    if (this.parameters !== undefined) {
      throw new Error('Parameters already set');
    }
    this.body = body;
    this.headers["Content-Type"] = contentType ?? "application/json";
    return this;
  }

  text(body: string, contentType?: string): HttpPostRequest {
    this.body = body;
    this.headers["Content-Type"] = contentType ?? "text/plain";
    return this;
  }

  async send(): Promise<HttpResponse> {
    let url = this.request.client.baseUrl + this.request.path;
    let body = undefined;
    if (this.parameters !== undefined) {
      body = new URLSearchParams(this.parameters);
    } else if (this.body !== undefined) {
      if (typeof this.body === "string") {
        body = this.body;
      } else {
        body = JSON.stringify(this.body);
      }
      // TODO Add Content-Length
    } else {
      this.headers["Content-Length"] = "0";
    }
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body
    });
    return new HttpResponse(res);
  }
}

export class HttpResponse {

  readonly response: Response;

  constructor(response: Response) {
    this.response = response;
  }

  success(): boolean {
    return this.response.status === StatusCode.OK
      || this.response.status === StatusCode.CREATED
      || this.response.status === StatusCode.NO_CONTENT;
  }

  contentType(): string {
    return this.response.headers.get("content-type");
  }

  status(): number {
    return this.response.status;
  }

  statusText(): string {
    return this.response.statusText;
  }

  async json(): Promise<any> {
    return await this.response.json();
  }

  async text(): Promise<string> {
    return await this.response.text();
  }
}
