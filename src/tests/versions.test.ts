/**
 * Tests for versions methods.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude } from '../index.ts';
import { createMockJSONResponse, mockFetch } from './helpers/mod.ts';

const LATITUDE_API_KEY = 'fake-api-key';
const PROJECT_ID = 123;

const MOCK_VERSION = {
  id: 1,
  uuid: 'version-uuid',
  title: 'v1',
  description: 'Test version',
  projectId: PROJECT_ID,
  version: 1,
  userId: 'user-id',
  mergedAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

Deno.test('versions.getAll() - retrieves all versions', async () => {
  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse([MOCK_VERSION])),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const versions = await sdk.versions.getAll(PROJECT_ID);

    assertExists(versions);
    assertEquals(Array.isArray(versions), true);
    assertEquals(versions.length, 1);
    assertEquals(versions[0].uuid, MOCK_VERSION.uuid);
  } finally {
    restore();
  }
});

Deno.test('versions.get() - retrieves specific version', async () => {
  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse(MOCK_VERSION)),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const version = await sdk.versions.get(PROJECT_ID, 'version-uuid');

    assertExists(version);
    assertEquals(version.uuid, MOCK_VERSION.uuid);
  } finally {
    restore();
  }
});

Deno.test('versions.create() - creates new version', async () => {
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(createMockJSONResponse(MOCK_VERSION));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const version = await sdk.versions.create('v2.0', { projectId: PROJECT_ID });

    assertExists(version);
    assertExists(requestBody);
    const body = requestBody as Record<string, unknown>;
    assertEquals(body['name'], 'v2.0');
  } finally {
    restore();
  }
});

Deno.test('versions.push() - pushes changes', async () => {
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(
        createMockJSONResponse({
          commitUuid: 'new-commit-uuid',
          documentsProcessed: 1,
        }),
      );
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const result = await sdk.versions.push(PROJECT_ID, 'base-commit-uuid', [
      {
        path: 'test.md',
        content: 'New content',
        status: 'modified',
      },
    ]);

    assertExists(result);
    assertEquals(result.commitUuid, 'new-commit-uuid');
    assertExists(requestBody);
    const body = requestBody as Record<string, unknown>;
    const changes = body['changes'] as Array<Record<string, unknown>>;
    assertEquals(changes[0]['path'], 'test.md');
    assertEquals(changes[0]['status'], 'modified');
  } finally {
    restore();
  }
});
