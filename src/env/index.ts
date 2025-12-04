function generateEnv() {
  // Support both DENO_ENV and NODE_ENV for compatibility
  const isProd =
    Deno.env.get('DENO_ENV') === 'production' ||
    Deno.env.get('NODE_ENV') === 'production'
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

function createEnv() {
  if (sdkEnv) return sdkEnv

  sdkEnv = generateEnv()
  return sdkEnv
}

export default createEnv()
