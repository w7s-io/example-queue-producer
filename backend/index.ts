type Env = {
  W7S_QUEUE: Fetcher;
  W7S_QUEUE_TOKEN: string;
  W7S_REPOSITORY: string;
  W7S_ENVIRONMENT: string;
};

const QUEUE_URL = "https://w7s.internal/api/v1/queues/w7s-io/example-queue-consumer/jobs";

const json = (body: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(body, null, 2), {
    ...init,
    headers
  });
};

const readJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const enqueue = async (request: Request, env: Env) => {
  const url = new URL(request.url);
  const id = crypto.randomUUID();
  const payload = {
    id,
    text: url.searchParams.get("text") || "hello from a separate W7S producer",
    createdAt: new Date().toISOString(),
    producer: env.W7S_REPOSITORY,
    target: "w7s-io/example-queue-consumer",
    queue: "jobs"
  };

  const response = await env.W7S_QUEUE.fetch(QUEUE_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.W7S_QUEUE_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return json(
    {
      service: "example-queue-producer",
      status: response.ok ? "queued" : "error",
      id,
      target: "w7s-io/example-queue-consumer",
      queue: "jobs",
      queueStatus: response.status,
      queueResponse: await readJson(response),
      checkDeliveryAt: `https://w7s-io.w7s.cloud/example-queue-consumer/messages/${id}`
    },
    { status: response.ok ? 202 : 502 }
  );
};

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({
        status: "ok",
        service: "example-queue-producer",
        repository: env.W7S_REPOSITORY,
        environment: env.W7S_ENVIRONMENT,
        targetQueue: "w7s-io/example-queue-consumer/jobs"
      });
    }

    if (url.pathname === "/enqueue" && (request.method === "GET" || request.method === "POST")) {
      return enqueue(request, env);
    }

    if (url.pathname === "/") {
      return json({
        service: "example-queue-producer",
        status: "ok",
        targetQueue: "w7s-io/example-queue-consumer/jobs",
        endpoints: {
          enqueue: "/enqueue",
          health: "/health"
        }
      });
    }

    return json(
      {
        status: "error",
        error: "Not found"
      },
      { status: 404 }
    );
  }
};
