/**
 * Example: RAG (Retrieval-Augmented Generation)
 * 
 * Demonstrates how to implement RAG pattern with:
 * 1. Tool-based retrieval
 * 2. Vector database integration (simulated)
 * 3. Context injection into prompts
 * 
 * Prerequisites:
 * - A prompt configured with a retrieval tool
 * - Vector database (Pinecone, Supabase Vector, etc.)
 * 
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 \
 *   deno run --allow-env --allow-net examples/rag_retrieval.ts
 */

import { Latitude } from '../src/mod.ts';

// Define tool types
type Tools = {
  get_answer: { question: string };
};

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== RAG Retrieval Example ===\n');

const question = 'What is the deepest ocean in the world?';

// Simulated vector database
const vectorDB = [
  {
    text: 'The Pacific Ocean is the deepest ocean, with the Mariana Trench reaching 10,994 meters.',
    embedding: [0.1, 0.2, 0.3], // Simulated
    score: 0.95,
  },
  {
    text: 'The Atlantic Ocean is the second-largest ocean.',
    embedding: [0.2, 0.3, 0.4],
    score: 0.65,
  },
];

try {
  console.log(`Question: ${question}\n`);
  console.log('Searching vector database...\n');

  const result = await latitude.prompts.run<Tools>('rag-assistant', {
    parameters: { question },
    tools: {
      get_answer: async ({ question: q }) => {
        console.log(`[Tool Called] get_answer("${q}")`);

        // In a real implementation:
        // 1. Generate embedding for the question
        // const embedding = await openai.embeddings.create({
        //   input: q,
        //   model: 'text-embedding-3-small',
        // });
        //
        // 2. Query vector database
        // const results = await pinecone.query({
        //   vector: embedding.data[0].embedding,
        //   topK: 10,
        //   includeMetadata: true,
        // });
        //
        // 3. Return the most relevant result
        // return results.matches[0]?.metadata?.answer;

        // Simulated retrieval
        const bestMatch = vectorDB[0];
        console.log(`[RAG] Found match (score: ${bestMatch.score})`);
        console.log(`[RAG] Context: ${bestMatch.text}\n`);

        return bestMatch.text;
      },
    },
  });

  console.log('=== AI Response ===');
  console.log(result?.response.text);
  console.log(`\nTokens used: ${result?.response.usage?.totalTokens}`);
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
console.log('\nNote: In production, integrate with:');
console.log('  - OpenAI Embeddings API for vector generation');
console.log('  - Pinecone, Supabase Vector, or Weaviate for storage');
console.log('  - Semantic search for retrieval');
