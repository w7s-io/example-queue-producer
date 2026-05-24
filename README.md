# example-queue-producer

W7S backend that sends messages to a queue owned by [`w7s-io/example-queue-consumer`](https://github.com/w7s-io/example-queue-consumer).

## Public endpoints

```text
GET  https://w7s-io.w7s.cloud/example-queue-producer/
GET  https://w7s-io.w7s.cloud/example-queue-producer/health
POST https://w7s-io.w7s.cloud/example-queue-producer/enqueue
```

`/enqueue` sends a JSON message through:

```text
env.W7S_QUEUE.fetch("https://w7s.internal/api/v1/queues/w7s-io/example-queue-consumer/jobs")
```

The response includes a `checkDeliveryAt` URL pointing at the consumer app:

```text
https://w7s-io.w7s.cloud/example-queue-consumer/messages/:id
```

## Deploy

This repo deploys on every push with:

```yaml
- uses: w7s-io/w7s-cloud@v1
  with:
    token: ${{ github.token }}
```

The workflow smoke test enqueues a message and polls the consumer until the message is processed.
