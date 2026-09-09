> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Batch Get Messages

POST https://api.agentmail.to/v0/inboxes/{inbox_id}/messages/batch-get
Content-Type: application/json

Fetch metadata for up to 500 messages in one request. Missing or
restricted IDs are silently omitted; compare `count` against `limit`
to detect misses.

**CLI:**

```bash
agentmail inboxes messages batch-get --inbox-id <inbox_id> --message-ids <id1> --message-ids <id2>
```

Reference: https://docs.agentmail.to/api-reference/inboxes/messages/batch-get

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

### Body (application/json)

- `message_ids` (list of string, required) — IDs of messages to fetch. Maximum 500 ids per request. Duplicates are rejected with a validation error. IDs not found in the inbox (including cross-inbox or permission-restricted) are silently omitted from the response; callers detect misses by comparing `count` against `limit`.

## Response

### 200

- `limit` (integer, required) — Limit of number of items returned.
- `count` (integer, required) — Number of items returned.
- `messages` (list of object, required) — Found messages. Order matches `message_ids` in the request. Body fields (`text`, `html`, `extracted_text`, `extracted_html`) are never populated; use the single-message endpoint to retrieve bodies.
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

## Examples

**Request**

```json
{
  "message_ids": [
    "message_ids",
    "message_ids"
  ]
}
```

**Response**

```json
{
  "limit": 1,
  "count": 1,
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
    await client.inboxes.messages.batchGet("inbox_id", {
        messageIds: [
            "message_ids",
            "message_ids",
        ],
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.messages.batch_get(
    inbox_id="inbox_id",
    message_ids=[
        "message_ids",
        "message_ids"
    ],
)

```

```go
package main

import (
	"fmt"
	"strings"
	"net/http"
	"io"
)

func main() {

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-get"

	payload := strings.NewReader("{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}")

	req, _ := http.NewRequest("POST", url, payload)

	req.Header.Add("Authorization", "Bearer <api_key>")
	req.Header.Add("Content-Type", "application/json")

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-get")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-get")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-get', [
  'body' => '{
  "message_ids": [
    "message_ids",
    "message_ids"
  ]
}',
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
    'Content-Type' => 'application/json',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-get");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = ["message_ids": ["message_ids", "message_ids"]] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-get")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
request.allHTTPHeaderFields = headers
request.httpBody = postData as Data

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