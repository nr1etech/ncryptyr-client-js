import {TestHelper} from "./test-helper";
import * as fs from "fs";
import {NcryptyrClient, NcryptyrClientConfig} from "../src";

test("Validate Config File", () => {
  if (fs.existsSync("ncryptyr.json") && process.env.NCRYPTYR_BASE_URL === undefined) {
    const config = JSON.parse(fs.readFileSync("ncryptyr.json", "utf-8")) as NcryptyrClientConfig;
    const client = new NcryptyrClient();
    expect(client.baseUrl).toEqual(config.baseUrl);
  }
});

test("Create Account", async () => {
  const client = TestHelper.client();
  const accountId = TestHelper.accountId();
  const res = await client.createAccount({
    id: accountId,
    contact: TestHelper.contact()
  });
  expect(res.id).toEqual(accountId);
  expect(res.contact.name).toEqual(TestHelper.contact().name);
  expect(res.contact.email).toEqual(TestHelper.contact().email);
});
