> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Get Thread

GET https://api.agentmail.to/v0/inboxes/{inbox_id}/threads/{thread_id}

**CLI:**

```bash
agentmail inboxes threads get --inbox-id <inbox_id> --thread-id <thread_id>
```

Reference: https://docs.agentmail.to/api-reference/inboxes/threads/get

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `inbox_id` (string, required) — The ID of the inbox.
- `thread_id` (string, required) — ID of thread.

## Response

### 200

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
- `messages` (list of object, required) — Messages in thread. Ordered by `timestamp` ascending.
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

## Examples

**Response**

```json
{
  "inbox_id": "inbox_id",
  "thread_id": "thread_id",
  "labels": [
    "labels",
    "labels"
  ],
  "timestamp": "2024-01-15T09:30:00Z",
  "senders": [
    "senders",
    "senders"
  ],
  "recipients": [
    "recipients",
    "recipients"
  ],
  "last_message_id": "last_message_id",
  "message_count": 1,
  "size": 1,
  "updated_at": "2024-01-15T09:30:00Z",
  "created_at": "2024-01-15T09:30:00Z",
  "messages": [
    {
      "inbox_id": "inbox_id",
      "thread_id": "thread_id",
      "message_id": "message_id",
      "labels": [
        "labels",
        "labels"
      ],
      "timestamp": "2024-01-15T09:30:00Z",
      "from": "from",
      "to": [
        "to",
        "to"
      ],
      "size": 1,
      "updated_at": "2024-01-15T09:30:00Z",
      "created_at": "2024-01-15T09:30:00Z",
      "reply_to": [
        "reply_to",
        "reply_to"
      ],
      "cc": [
        "cc",
        "cc"
      ],
      "bcc": [
        "bcc",
        "bcc"
      ],
      "subject": "subject",
      "preview": "preview",
      "text": "text",
      "html": "html",
      "extracted_text": "extracted_text",
      "extracted_html": "extracted_html",
      "attachments": [
        {
          "attachment_id": "attachment_id",
          "size": 1,
          "filename": "filename",
          "content_type": "content_type",
          "content_disposition": "inline",
          "content_id": "content_id"
        },
        {
          "attachment_id": "attachment_id",
          "size": 1,
          "filename": "filename",
          "content_type": "content_type",
          "content_disposition": "inline",
          "content_id": "content_id"
        }
      ],
      "in_reply_to": "in_reply_to",
      "references": [
        "references",
        "references"
      ],
      "headers": {
        "headers": "headers"
      }
    },
    {
      "inbox_id": "inbox_id",
      "thread_id": "thread_id",
      "message_id": "message_id",
      "labels": [
        "labels",
        "labels"
      ],
      "timestamp": "2024-01-15T09:30:00Z",
      "from": "from",
      "to": [
        "to",
        "to"
      ],
      "size": 1,
      "updated_at": "2024-01-15T09:30:00Z",
      "created_at": "2024-01-15T09:30:00Z",
      "reply_to": [
        "reply_to",
        "reply_to"
      ],
      "cc": [
        "cc",
        "cc"
      ],
      "bcc": [
        "bcc",
        "bcc"
      ],
      "subject": "subject",
      "preview": "preview",
      "text": "text",
      "html": "html",
      "extracted_text": "extracted_text",
      "extracted_html": "extracted_html",
      "attachments": [
        {
          "attachment_id": "attachment_id",
          "size": 1,
          "filename": "filename",
          "content_type": "content_type",
          "content_disposition": "inline",
          "content_id": "content_id"
        },
        {
          "attachment_id": "attachment_id",
          "size": 1,
          "filename": "filename",
          "content_type": "content_type",
          "content_disposition": "inline",
          "content_id": "content_id"
        }
      ],
      "in_reply_to": "in_reply_to",
      "references": [
        "references",
        "references"
      ],
      "headers": {
        "headers": "headers"
      }
    }
  ],
  "received_timestamp": "2024-01-15T09:30:00Z",
  "sent_timestamp": "2024-01-15T09:30:00Z",
  "subject": "subject",
  "preview": "preview",
  "attachments": [
    {
      "attachment_id": "attachment_id",
      "size": 1,
      "filename": "filename",
      "content_type": "content_type",
      "content_disposition": "inline",
      "content_id": "content_id"
    },
    {
      "attachment_id": "attachment_id",
      "size": 1,
      "filename": "filename",
      "content_type": "content_type",
      "content_disposition": "inline",
      "content_id": "content_id"
    }
  ]
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.inboxes.threads.get("inbox_id", "thread_id");
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.threads.get(
    inbox_id="inbox_id",
    thread_id="thread_id",
)

```

```go
package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/threads/thread_id"

	req, _ := http.NewRequest("GET", url, nil)

	req.Header.Add("Authorization", "Bearer <api_key>")

	res, _ := http.DefaultClient.Do(req)

	defer res.Body.Close()
	body, _ := io.ReadAll(res.Body)

	fmt.Println(res)
	fmt.Println(string(body))

}
```

```ruby
require 'uri'
require 'net/http'

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/threads/thread_id")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)
request["Authorization"] = 'Bearer <api_key>'

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/inboxes/inbox_id/threads/thread_id")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/inboxes/inbox_id/threads/thread_id', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/threads/thread_id");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/threads/thread_id")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "GET"
request.allHTTPHeaderFields = headers

let session = URLSession.shared
let dataTask = session.dataTask(with: request as URLRequest, completionHandler: { (data, response, error) -> Void in
  if (error != nil) {
    print(error as Any)
  } else {
    let httpResponse = response as? HTTPURLResponse
    print(httpResponse)
  }
})

dataTask.resume()
```