type SdkEnv = {
  GATEWAY_HOSTNAME: string;
  GATEWAY_SSL: boolean;
  GATEWAY_PORT?: number;
};

function generateEnv(): SdkEnv {
  const defaultHostname = 'gateway.latitude.so';
  const defaultPort = undefined;
  const defaultSsl = true;

  // Parse GATEWAY_PORT safely (NaN becomes undefined)
  const portEnv = Deno.env.get('GATEWAY_PORT');
  const parsedPort = portEnv ? Number(portEnv) : defaultPort;
  const finalPort = parsedPort && !Number.isNaN(parsedPort) ? parsedPort : undefined;

  // Parse GATEWAY_SSL (explicit 'false' disables, otherwise follow default)
  const sslEnv = Deno.env.get('GATEWAY_SSL');
  const finalSsl = sslEnv === 'false' ? false : (sslEnv === 'true' ? true : defaultSsl);

  return {
    GATEWAY_HOSTNAME: Deno.env.get('GATEWAY_HOSTNAME') ?? defaultHostname,
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
