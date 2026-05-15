import http from "node:http";

function readPort(name, defaultValue) {
  const value = process.env[name] ?? defaultValue;
  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`${name} must be a TCP port, got ${JSON.stringify(value)}`);
  }

  return port;
}

const listenPort = readPort("ONYXIA_PROXY_PORT", "18080");
const webPort = readPort("ONYXIA_WEB_PORT", "18082");
const apiPort = readPort("ONYXIA_API_PORT", "18083");
const onboardingPort =
  process.env.ONYXIA_ONBOARDING_PORT === undefined
    ? undefined
    : readPort("ONYXIA_ONBOARDING_PORT");

const server = http.createServer((clientReq, clientRes) => {
  const path = clientReq.url ?? "/";
  const isOnboarding =
    path === "/api/onboarding" || path.startsWith("/api/onboarding/");
  const isApi = path === "/api" || path.startsWith("/api/");
  const targetPort =
    onboardingPort !== undefined && isOnboarding
      ? onboardingPort
      : isApi
        ? apiPort
        : webPort;

  const upstreamReq = http.request(
    {
      hostname: "127.0.0.1",
      port: targetPort,
      method: clientReq.method,
      path,
      headers: clientReq.headers
    },
    upstreamRes => {
      clientRes.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(clientRes);
    }
  );

  upstreamReq.on("error", error => {
    clientRes.writeHead(502, { "content-type": "text/plain" });
    clientRes.end(`Proxy upstream error: ${error.message}\n`);
  });

  clientReq.pipe(upstreamReq);
});

server.listen(listenPort, "127.0.0.1", () => {
  console.log(
    [
      `Onyxia local proxy: http://127.0.0.1:${listenPort}`,
      `/ -> 127.0.0.1:${webPort}`,
      `/api -> 127.0.0.1:${apiPort}`,
      onboardingPort === undefined
        ? undefined
        : `/api/onboarding -> 127.0.0.1:${onboardingPort}`
    ]
      .filter(Boolean)
      .join(", ")
  );
});
