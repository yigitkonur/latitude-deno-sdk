import { Latitude } from '@yigitkonur/latitude-deno-sdk'

const LATITUDE_API_KEY = '1211393d-9773-4ab1-91ab-ca418e340dbc'
const LATITUDE_PROJECT_ID = 28196

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'list'

  try {
    const latitude = new Latitude(LATITUDE_API_KEY, {
      projectId: LATITUDE_PROJECT_ID,
    })

    // Action: list - List all prompts
    if (action === 'list') {
      const prompts = await latitude.prompts.getAll()
      return new Response(
        JSON.stringify({
          success: true,
          action: 'list',
          count: prompts.length,
          prompts: prompts.map((p) => ({
            path: p.path,
            config: p.config,
          })),
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Action: run - Run the extract-linkedin-from-serp prompt
    if (action === 'run') {
      const testQuery = 'john smith software engineer'
      const testSerp = JSON.stringify({
        organic: [
          {
            title: 'John Smith - Senior Software Engineer at Google',
            snippet:
              'LinkedIn · John Smith · 5K+ followers · San Francisco Bay Area · Senior Software Engineer · Google · Experience: Google · Education: Stanford University',
            link: 'https://www.linkedin.com/in/johnsmith-google',
            position: 1,
          },
        ],
      })

      const result = await latitude.prompts.run('extract-linkedin-from-serp', {
        stream: false,
        parameters: {
          query: testQuery,
          serp_results: testSerp,
        },
      })

      return new Response(
        JSON.stringify({
          success: true,
          action: 'run',
          prompt: 'extract-linkedin-from-serp',
          result: result?.response,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unknown action. Use ?action=list or ?action=run',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
