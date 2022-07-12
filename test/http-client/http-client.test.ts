import {HttpClient} from "../../src/http-client"

test("Test HttpGetRequest", async () => {
  const res = await new HttpClient("https://www.google.com")
    .request("/")
    .get()
    .send();
  expect(res.status()).toEqual(200);
  expect(res.success()).toEqual(true);
  const text = await res.text();
  expect(text.length).toBeGreaterThan(0);
});
