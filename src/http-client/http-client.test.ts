/**
 * Integration tests for HttpClient
 *
 * @group integration/http-client
 */

import {HttpStatusCode} from '@nr1e/commons/http';
import {HttpClient} from '../index';

test('Test HttpGetRequest', async () => {
  const res = await new HttpClient('https://www.google.com')
    .request('/')
    .get()
    .send();
  expect(res.status()).toEqual(HttpStatusCode.OK);
  expect(res.success()).toEqual(true);
  const text = await res.text();
  expect(text.length).toBeGreaterThan(0);
});
