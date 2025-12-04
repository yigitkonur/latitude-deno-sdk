function generateEnv() {
  // Detect production environment:
  // 1. DENO_ENV or NODE_ENV set to 'production'
  // 2. Running in Supabase Edge Functions (SUPABASE_URL is set)
  // 3. Running in Deno Deploy (DENO_DEPLOYMENT_ID is set)
  const isSupabase = !!Deno.env.get('SUPABASE_URL')
  const isDenoDeploy = !!Deno.env.get('DENO_DEPLOYMENT_ID')
  const isExplicitProd =
    Deno.env.get('DENO_ENV') === 'production' ||
    Deno.env.get('NODE_ENV') === 'production'
  
  // Default to production if in any cloud runtime or explicitly set
  const isProd = isExplicitProd || isSupabase || isDenoDeploy
  
  const defaultHostname = isProd ? 'gateway.latitude.so' : 'localhost'
  const defaultPort = !isProd ? 8787 : undefined
  const defaultSsl = isProd ? true : false

  return {
    GATEWAY_HOSTNAME: Deno.env.get('GATEWAY_HOSTNAME') ?? defaultHostname,
    GATEWAY_PORT: Number(Deno.env.get('GATEWAY_PORT') ?? defaultPort),
    GATEWAY_SSL: Deno.env.get('GATEWAY_SSL') === 'true' || defaultSsl,
  }
}

type SdkEnv = {
  GATEWAY_HOSTNAME: string
  GATEWAY_SSL: boolean
  GATEWAY_PORT?: number
}

let sdkEnv: SdkEnv

function createEnv(): SdkEnv {
  if (sdkEnv) return sdkEnv

  sdkEnv = generateEnv()
  return sdkEnv
}

/** SDK environment configuration. */
const env: SdkEnv = createEnv()
export default env
