/**
 * Integration tests for HttpClient
 *
 * @group integration/http-client
 */

import {HttpClient, StatusCode} from '../../src';

test('Test HttpGetRequest', async () => {
  const res = await new HttpClient('https://www.google.com')
    .request('/')
    .get()
    .send();
  expect(res.status()).toEqual(StatusCode.OK);
  expect(res.success()).toEqual(true);
  const text = await res.text();
  expect(text.length).toBeGreaterThan(0);
});
