import {Contact} from "../src/types";
import {NcryptyrClient} from "../src";
import * as fs from "fs";

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
}

