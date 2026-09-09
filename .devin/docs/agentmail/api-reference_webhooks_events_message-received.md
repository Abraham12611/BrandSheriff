> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Message Received

POST 

Reference: https://docs.agentmail.to/api-reference/webhooks/events/message-received

## Request

### Headers

- `svix-id` (string, required) — ID of webhook message.
- `svix-signature` (string, required) — Signature of webhook message.
- `svix-timestamp` (datetime, required) — Timestamp of webhook message.

### Payload

- `type` ("event", required)
- `event_type` (enum, required)
  - Allowed values: `message.received`, `message.received.spam`, `message.received.blocked`, `message.received.unauthenticated`
- `event_id` (string, required) — ID of event.
- `message` (object, required)
  - `inbox_id` (string, required) — The ID of the inbox.
  - `thread_id` (string, required) — ID of thread.
  - `message_id` (string, required) — ID of message.
  - `labels` (list of string, required) — Labels of message.
  - `timestamp` (datetime, required) — Time at which message was sent or drafted.
  - `from` (string, required) — Address of sender. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `to` (list of string, required) — Addresses of recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `size` (integer, required) — Size of message in bytes.
  - `updated_at` (datetime, required) — Time at which message was last updated.
  - `created_at` (datetime, required) — Time at which message was created.
  - `reply_to` (list of string, optional) — Reply-to addresses. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `cc` (list of string, optional) — Addresses of CC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `bcc` (list of string, optional) — Addresses of BCC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `subject` (string, optional) — Subject of message.
  - `preview` (string, optional) — Text preview of message.
  - `text` (string, optional) — Plain text body of message.
  - `html` (string, optional) — HTML body of message.
  - `extracted_text` (string, optional) — Extracted new text content.
  - `extracted_html` (string, optional) — Extracted new HTML content.
  - `attachments` (list of object, optional) — Attachments in message.
    - `attachment_id` (string, required) — ID of attachment.
    - `size` (integer, required) — Size of attachment in bytes.
    - `filename` (string, optional) — Filename of attachment.
    - `content_type` (string, optional) — Content type of attachment.
    - `content_disposition` (enum, optional) — Content disposition of attachment.
      - Allowed values: `inline`, `attachment`
    - `content_id` (string, optional) — Content ID of attachment.
  - `in_reply_to` (string, optional) — ID of message being replied to.
  - `references` (list of string, optional) — IDs of previous messages in thread.
  - `headers` (map from string to string, optional) — Headers in message.
- `thread` (object, required)
  - `inbox_id` (string, required) — The ID of the inbox.
  - `thread_id` (string, required) — ID of thread.
  - `labels` (list of string, required) — Labels of thread.
  - `timestamp` (datetime, required) — Timestamp of last sent or received message.
  - `senders` (list of string, required) — Senders in thread. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `recipients` (list of string, required) — Recipients in thread. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `last_message_id` (string, required) — ID of last message in thread.
  - `message_count` (integer, required) — Number of messages in thread.
  - `size` (integer, required) — Size of thread in bytes.
  - `updated_at` (datetime, required) — Time at which thread was last updated.
  - `created_at` (datetime, required) — Time at which thread was created.
  - `received_timestamp` (datetime, optional) — Timestamp of last received message.
  - `sent_timestamp` (datetime, optional) — Timestamp of last sent message.
  - `subject` (string, optional) — Subject of thread.
  - `preview` (string, optional) — Text preview of last message in thread.
  - `attachments` (list of object, optional) — Attachments in thread.
    - `attachment_id` (string, required) — ID of attachment.
    - `size` (integer, required) — Size of attachment in bytes.
    - `filename` (string, optional) — Filename of attachment.
    - `content_type` (string, optional) — Content type of attachment.
    - `content_disposition` (enum, optional) — Content disposition of attachment.
      - Allowed values: `inline`, `attachment`
    - `content_id` (string, optional) — Content ID of attachment.