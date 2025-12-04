/**
 * Example: Get Versions
 * 
 * Demonstrates how to list and work with prompt versions.
 * 
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/get_versions.ts
 */

import { Latitude } from '../src/mod.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Get Versions Example ===\n');

try {
  // List all projects first
  console.log('Available Projects:\n');
  const projects = await latitude.projects.getAll();

  for (const project of projects.slice(0, 3)) {
    console.log(`📦 ${project.name} (ID: ${project.id})`);
  }

  // Get versions for the current project
  const projectId = Number(Deno.env.get('LATITUDE_PROJECT_ID'));
  console.log(`\nFetching versions for project ${projectId}...\n`);

  const versions = await latitude.versions.getAll(projectId);

  console.log(`Found ${versions.length} versions:\n`);

  for (const version of versions) {
    const status = version.mergedAt ? '✅ Published' : '🔄 Draft';
    console.log(`${status} ${version.title}`);
    console.log(`   UUID: ${version.uuid}`);
    console.log(`   Created: ${new Date(version.createdAt).toLocaleDateString()}`);
    if (version.description) {
      console.log(`   Description: ${version.description}`);
    }
    console.log('');
  }

  // Find the live version
  const liveVersion = versions.find((v) => v.mergedAt !== null);
  if (liveVersion) {
    console.log(`Current live version: ${liveVersion.title} (${liveVersion.uuid})`);
  }
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
