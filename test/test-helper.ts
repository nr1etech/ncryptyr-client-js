import {Account, ApiKey, Contact} from "../src/types";
import {NcryptyrClient} from "../src";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface NewAccountOutput {
  readonly client: NcryptyrClient;
  readonly account: Account;
  readonly apiKey: ApiKey;
}

const CONFIG_FILE_NAME = "ncryptyr.json";

export interface NcryptyrClientConfig {
  readonly baseUrl?: string;
  readonly apiKey: string;
}

export class TestHelper {

  static readConfigFile(): NcryptyrClientConfig {
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

    return file !== undefined ? JSON.parse(fs.readFileSync(file, "utf-8")) : {};
  }

  static client(): NcryptyrClient {
    if (process.env.NCRYPTYR_BASE_URL !== undefined || fs.existsSync("ncryptyr.json")) {
      const config = this.readConfigFile();
      return new NcryptyrClient(config.apiKey, config.baseUrl);
    } else {
      return new NcryptyrClient("https://api-stage.ncryptyr.com");
    }
  }

  static accountId(): string {
    return `NcryptyrClientTest${Date.now()}`;
  }

  static contact(): Contact {
    return {
      name: "Quality Assurance",
      email: "ncryptyr-client-test@ncryptyr.com"
    }
  }

  static async newAccount(): Promise<NewAccountOutput> {
    const client = this.client();
    const accountId = this.accountId();
    const contact = TestHelper.contact();
    const out = await client.enroll({
      id: accountId,
      contact: TestHelper.contact()
    });
    expect(out.account.contact).toEqual(contact);
    expect(out.account.createdDate).toBeDefined();
    expect(out.apiKey.secret).toBeDefined();
    expect(out.apiKey.createdDate).toBeDefined();
    expect(out.apiKey.id).toEqual("master");
    expect(out.apiKey.accountId).toEqual(accountId);
    client.apiKey(out.apiKey.secret);
    return {
      client,
      ...out
    }
  }
}

