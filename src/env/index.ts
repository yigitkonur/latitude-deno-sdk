type SdkEnv = {
  GATEWAY_HOSTNAME: string;
  GATEWAY_SSL: boolean;
  GATEWAY_PORT?: number;
};

function generateEnv(): SdkEnv {
  // Detect development environment (EXPLICIT opt-in only):
  // - DENO_ENV or NODE_ENV explicitly set to 'development' or 'local'
  // - GATEWAY_HOSTNAME explicitly set to 'localhost'
  const explicitLocalhost = Deno.env.get("GATEWAY_HOSTNAME") === "localhost";
  const isExplicitDev = Deno.env.get("DENO_ENV") === "development" ||
    Deno.env.get("DENO_ENV") === "local" ||
    Deno.env.get("NODE_ENV") === "development" ||
    Deno.env.get("NODE_ENV") === "local";

  // SAFE DEFAULT: Production (gateway.latitude.so)
  // Only use localhost if explicitly requested via env vars
  const isDev = isExplicitDev || explicitLocalhost;

  const defaultHostname = isDev ? "localhost" : "gateway.latitude.so";
  const defaultPort = isDev ? 8787 : undefined;
  const defaultSsl = !isDev;

  // Parse GATEWAY_PORT safely (NaN becomes undefined)
  const portEnv = Deno.env.get("GATEWAY_PORT");
  const parsedPort = portEnv ? Number(portEnv) : defaultPort;
  const finalPort = parsedPort && !Number.isNaN(parsedPort)
    ? parsedPort
    : undefined;

  // Parse GATEWAY_SSL (explicit 'false' disables, otherwise follow default)
  const sslEnv = Deno.env.get("GATEWAY_SSL");
  const finalSsl = sslEnv === "false"
    ? false
    : (sslEnv === "true" ? true : defaultSsl);

  return {
    GATEWAY_HOSTNAME: Deno.env.get("GATEWAY_HOSTNAME") ?? defaultHostname,
    GATEWAY_PORT: finalPort,
    GATEWAY_SSL: finalSsl,
  };
}

let sdkEnv: SdkEnv;

function createEnv(): SdkEnv {
  if (sdkEnv) return sdkEnv;

  sdkEnv = generateEnv();
  return sdkEnv;
}

/** SDK environment configuration. */
const env: SdkEnv = createEnv();
export default env;
