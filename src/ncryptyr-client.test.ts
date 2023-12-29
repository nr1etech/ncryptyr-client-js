/**
 * Integration tests for ncryptyr-client.
 *
 * @group integration/ncryptyr-client
 */
import {HelperTest} from './helper.test';
import {ApiKey, EncryptionKeyType} from './index';

jest.setTimeout(10000);

test('Happy Path', async () => {
  const newAccount = await HelperTest.newAccount();
  const client = newAccount.client;
  const account = newAccount.account;
  try {
    let describeAccount = await client.describeAccount();
    expect(describeAccount).toEqual(account);

    describeAccount = await client.describeAccount({id: account.id});
    expect(describeAccount).toEqual(account);

    let listAccounts = await client.listAccounts();
    expect(listAccounts.accounts).toContainEqual(describeAccount);

    listAccounts = await client.listAccounts({idBeginsWith: account.id});
    expect(listAccounts.accounts).toContainEqual(describeAccount);

    let updateAccount = await client.updateAccountOld({
      contact: {
        name: 'Quality Assurance Updated',
      },
    });
    expect(updateAccount.contact.name).toEqual('Quality Assurance Updated');

    updateAccount = await client.updateAccount({
      id: account.id,
      contact: {
        name: 'Quality Assurance Updated X',
        email: 'test@example.com',
      },
    });
    expect(updateAccount.contact.name).toEqual('Quality Assurance Updated X');

    updateAccount = await client.updateAccountOld({
      contact: {
        name: 'Quality Assurance',
        email: 'qa@ncryptyr.com',
      },
    });
    expect(updateAccount.contact.name).toEqual('Quality Assurance');
    expect(updateAccount.contact.email).toEqual('qa@ncryptyr.com');

    updateAccount = await client.updateAccount({
      id: account.id,
      contact: account.contact,
    });
    expect(updateAccount).toEqual(account);

    const apiKeyWithSecret = await client.createApiKey({
      id: 'TestKey',
    });
    expect(apiKeyWithSecret.id).toEqual('TestKey');
    expect(apiKeyWithSecret.accountId).toEqual(account.id);
    // expect(apiKeyWithSecret.createdDate).toBeDefined();
    expect(apiKeyWithSecret.secret).toBeDefined();

    const apiKey: ApiKey = {
      id: apiKeyWithSecret.id,
      accountId: apiKeyWithSecret.accountId,
      // createdDate: apiKeyWithSecret.createdDate,
    };

    let listApiKeys = await client.listApiKeys();
    expect(listApiKeys.length).toEqual(2);
    expect(listApiKeys).toContainEqual(apiKey);

    listApiKeys = await client.listApiKeys({idBeginsWith: apiKey.id});
    expect(listApiKeys.length).toEqual(1);
    expect(listApiKeys).toContainEqual(apiKey);

    await client.deleteApiKey({id: apiKey.id});
    listApiKeys = await client.listApiKeys();
    expect(listApiKeys.length).toEqual(1);

    const encryptionKey1 = await client.createEncryptionKey({id: 'TestKey1'});
    expect(encryptionKey1.id).toEqual('TestKey1');
    expect(encryptionKey1.accountId).toEqual(account.id);
    // expect(encryptionKey1.createdDate).toBeDefined();
    expect(encryptionKey1.type).toEqual(EncryptionKeyType.AES_128);

    const describeEncryptionKey = await client.describeEncryptionKey({
      id: 'TestKey1',
    });
    expect(describeEncryptionKey).toEqual(encryptionKey1);

    const encryptionKey2 = await client.createEncryptionKey({id: 'TestKey2'});
    expect(encryptionKey2.id).toEqual('TestKey2');
    expect(encryptionKey2.accountId).toEqual(account.id);
    // expect(encryptionKey2.createdDate).toBeDefined();
    expect(encryptionKey2.type).toEqual(EncryptionKeyType.AES_128);

    let encryptionKeys = await client.listEncryptionKeys();
    expect(encryptionKeys.length).toEqual(2);
    expect(encryptionKeys).toContainEqual(encryptionKey1);
    expect(encryptionKeys).toContainEqual(encryptionKey2);

    await client.deleteEncryptionKey({id: encryptionKey2.id});
    encryptionKeys = await client.listEncryptionKeys();
    expect(encryptionKeys.length).toEqual(1);
    expect(encryptionKeys).toContainEqual(encryptionKey1);

    const ciphertext = await client.encrypt('TestKey1', 'some awesome text');
    const text = await client.decrypt(ciphertext);
    expect(text).toEqual('some awesome text');
  } finally {
    await client.deleteAccount({id: account.id});
  }
});
