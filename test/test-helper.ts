import {Account, ApiKey, Contact} from "../src/types";
import {NcryptyrClient} from "../src";
import * as fs from "fs";

export interface NewAccountOutput {
  readonly client: NcryptyrClient;
  readonly account: Account;
  readonly apiKey: ApiKey;
}

export class TestHelper {

  static client(): NcryptyrClient {
    if (process.env.NCRYPTYR_BASE_URL !== undefined || fs.existsSync("ncryptyr.json")) {
      return new NcryptyrClient();
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

