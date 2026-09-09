> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Message Opened

POST 

Reference: https://docs.agentmail.to/api-reference/webhooks/events/message-opened

## Request

### Headers

- `svix-id` (string, required) — ID of webhook message.
- `svix-signature` (string, required) — Signature of webhook message.
- `svix-timestamp` (datetime, required) — Timestamp of webhook message.

### Payload

- `type` ("event", required)
- `event_type` ("message.opened", required)
- `event_id` (string, required) — ID of event.
- `open` (object, required)
  - `inbox_id` (string, required) — The ID of the inbox.
  - `thread_id` (string, required) — ID of thread.
  - `message_id` (string, required) — ID of message.
  - `timestamp` (datetime, required) — Timestamp of event.