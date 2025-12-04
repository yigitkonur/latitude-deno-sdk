/**
 * Tests for projects methods.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude } from '../index.ts';
import { createMockJSONResponse, mockFetch } from './helpers/mod.ts';

const LATITUDE_API_KEY = 'fake-api-key';

const MOCK_PROJECT = {
  id: 1,
  name: 'Test Project',
  workspaceId: 1,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
};

const MOCK_VERSION = {
  id: 1,
  uuid: 'version-uuid',
  title: 'v1',
  description: null,
  projectId: 1,
  version: 1,
  userId: 'user-id',
  mergedAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

Deno.test('projects.getAll() - retrieves all projects', async () => {
  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse([MOCK_PROJECT])),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const projects = await sdk.projects.getAll();

    assertExists(projects);
    assertEquals(Array.isArray(projects), true);
    assertEquals(projects.length, 1);
    assertEquals(projects[0].id, MOCK_PROJECT.id);
  } finally {
    restore();
  }
});

Deno.test('projects.create() - creates new project', async () => {
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(
        createMockJSONResponse({
          project: MOCK_PROJECT,
          version: MOCK_VERSION,
        }),
      );
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const result = await sdk.projects.create('New Project');

    assertExists(result);
    assertExists(result.project);
    assertExists(result.version);
    assertExists(requestBody);
    const body = requestBody as Record<string, unknown>;
    assertEquals(body['name'], 'New Project');
  } finally {
    restore();
  }
});
