> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Search Messages

GET https://api.agentmail.to/v0/inboxes/{inbox_id}/messages/search

Full-text search across messages in the inbox, ranked by relevance. The
query is matched against the sender, recipients, and subject (substring)
and the message body (tokenized full text). Spam, trash, blocked, and
unauthenticated messages are always excluded. `limit` cannot exceed 100.

Reference: https://docs.agentmail.to/api-reference/inboxes/messages/search

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

### Query parameters

- `q` (string, required) — Full-text search query. Matched against the sender, recipients, and subject (substring) and the message body (tokenized full text).
- `limit` (integer, optional) — Limit of number of items returned.
- `page_token` (string, optional) — Page token for pagination.
- `before` (datetime, optional) — Timestamp before which to filter by.
- `after` (datetime, optional) — Timestamp after which to filter by.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `messages` (list of object, required) — Ordered by relevance, best match first.
  - `created_at` (datetime, required) — Time at which message was created.
  - `from` (string, required) — Address of sender. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `inbox_id` (string, required) — The ID of the inbox.
  - `labels` (list of string, required) — Labels of message.
  - `message_id` (string, required) — ID of message.
  - `size` (integer, required) — Size of message in bytes.
  - `thread_id` (string, required) — ID of thread.
  - `timestamp` (datetime, required) — Time at which message was sent or drafted.
  - `to` (list of string, required) — Addresses of recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `updated_at` (datetime, required) — Time at which message was last updated.
  - `attachments` (list of object, optional) — Attachments in message.
    - `attachment_id` (string, required) — ID of attachment.
    - `size` (integer, required) — Size of attachment in bytes.
    - `filename` (string, optional) — Filename of attachment.
    - `content_type` (string, optional) — Content type of attachment.
    - `content_disposition` (enum, optional) — Content disposition of attachment.
      - Allowed values: `inline`, `attachment`
    - `content_id` (string, optional) — Content ID of attachment.
  - `bcc` (list of string, optional) — Addresses of BCC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `cc` (list of string, optional) — Addresses of CC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `headers` (map from string to string, optional) — Headers in message.
  - `highlights` (object, optional) — Matched fragments per field. Present only when the query matched an indexed field.
    - `from` (list of string, optional) — Matched fragments from the sender address.
    - `recipients` (list of string, optional) — Matched fragments from the recipient addresses (to, cc, or bcc).
    - `subject` (list of string, optional) — Matched fragments from the subject.
    - `text` (list of string, optional) — Matched fragments from the message body.
  - `in_reply_to` (string, optional) — ID of message being replied to.
  - `preview` (string, optional) — Text preview of message.
  - `references` (list of string, optional) — IDs of previous messages in thread.
  - `subject` (string, optional) — Subject of message.
- `limit` (integer, optional) — Limit of number of items returned.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "messages": [
    {
      "created_at": "2024-01-15T09:30:00Z",
      "from": "from",
      "inbox_id": "inbox_id",
      "labels": [
        "labels",
        "labels"
      ],
      "message_id": "message_id",
      "size": 1,
      "thread_id": "thread_id",
      "timestamp": "2024-01-15T09:30:00Z",
      "to": [
        "to",
        "to"
      ],
      "updated_at": "2024-01-15T09:30:00Z",
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
      "bcc": [
        "bcc",
        "bcc"
      ],
      "cc": [
        "cc",
        "cc"
      ],
      "headers": {
        "headers": "headers"
      },
      "highlights": {
        "from": [
          "from",
          "from"
        ],
        "recipients": [
          "recipients",
          "recipients"
        ],
        "subject": [
          "subject",
          "subject"
        ],
        "text": [
          "text",
          "text"
        ]
      },
      "in_reply_to": "in_reply_to",
      "preview": "preview",
      "references": [
        "references",
        "references"
      ],
      "subject": "subject"
    },
    {
      "created_at": "2024-01-15T09:30:00Z",
      "from": "from",
      "inbox_id": "inbox_id",
      "labels": [
        "labels",
        "labels"
      ],
      "message_id": "message_id",
      "size": 1,
      "thread_id": "thread_id",
      "timestamp": "2024-01-15T09:30:00Z",
      "to": [
        "to",
        "to"
      ],
      "updated_at": "2024-01-15T09:30:00Z",
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
      "bcc": [
        "bcc",
        "bcc"
      ],
      "cc": [
        "cc",
        "cc"
      ],
      "headers": {
        "headers": "headers"
      },
      "highlights": {
        "from": [
          "from",
          "from"
        ],
        "recipients": [
          "recipients",
          "recipients"
        ],
        "subject": [
          "subject",
          "subject"
        ],
        "text": [
          "text",
          "text"
        ]
      },
      "in_reply_to": "in_reply_to",
      "preview": "preview",
      "references": [
        "references",
        "references"
      ],
      "subject": "subject"
    }
  ],
  "limit": 1,
  "next_page_token": "next_page_token"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.inboxes.messages.search("inbox_id", {
        q: "q",
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.messages.search(
    inbox_id="inbox_id",
    q="q",
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/messages/search?q=q"

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/messages/search?q=q")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/inboxes/inbox_id/messages/search?q=q")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/inboxes/inbox_id/messages/search?q=q', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/messages/search?q=q");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/messages/search?q=q")! as URL,
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