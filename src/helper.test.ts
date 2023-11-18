import {Account, ApiKey, Contact} from './index';
import {NcryptyrClient} from './index';
import * as process from 'process';

export interface NewAccountOutput {
  readonly client: NcryptyrClient;
  readonly account: Account;
  readonly apiKey: ApiKey;
}

export class HelperTest {
  static client(apiKey?: string): NcryptyrClient {
    return new NcryptyrClient({
      baseUrl:
        process.env.NCRYPTYR_BASE_URL ?? 'https://api.stage.ncryptyr.com',
      apiKey: apiKey,
    });
  }

  static accountId(): string {
    return `NcryptyrClientTest${Date.now()}`;
  }

  static contact(): Contact {
    return {
      name: 'Quality Assurance',
      email: 'ncryptyr-client-test@ncryptyr.com',
    };
  }

  static async newAccount(): Promise<NewAccountOutput> {
    const client = this.client();
    const accountId = this.accountId();
    const contact = HelperTest.contact();
    const out = await client.enroll({
      id: accountId,
      contact: HelperTest.contact(),
    });
    expect(out.account.contact).toEqual(contact);
    expect(out.account.createdDate).toBeDefined();
    expect(out.apiKey.secret).toBeDefined();
    expect(out.apiKey.createdDate).toBeDefined();
    expect(out.apiKey.id).toEqual('master');
    expect(out.apiKey.accountId).toEqual(accountId);
    client.apiKey(out.apiKey.secret);
    return {
      client,
      ...out,
    };
  }
}
test('Empty Test', async () => {
  // do nothing
});
