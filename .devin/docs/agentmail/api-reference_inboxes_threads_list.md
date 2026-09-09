> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Threads

GET https://api.agentmail.to/v0/inboxes/{inbox_id}/threads

Lists threads in the inbox, most recent first. Pass `senders`,
`recipients`, or `subject` to filter by substring. Filtered requests are
served by search, which caps `limit` at 100. For relevance-ranked
full-text search, use `Search Threads`.

**CLI:**

```bash
agentmail inboxes threads list --inbox-id <inbox_id>
```

Reference: https://docs.agentmail.to/api-reference/inboxes/threads/list

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

- `limit` (integer, optional) — Limit of number of items returned.
- `page_token` (string, optional) — Page token for pagination.
- `labels` (list of string, optional) — Labels to filter by.
- `before` (datetime, optional) — Timestamp before which to filter by.
- `after` (datetime, optional) — Timestamp after which to filter by.
- `ascending` (boolean, optional) — Sort in ascending temporal order.
- `include_spam` (boolean, optional) — Include spam in results.
- `include_blocked` (boolean, optional) — Include blocked in results.
- `include_unauthenticated` (boolean, optional) — Include unauthenticated in results.
- `include_trash` (boolean, optional) — Include trash in results.
- `senders` (list of string, optional) — Filter to threads whose senders contain this value (substring match). Repeatable; all values must match.
- `recipients` (list of string, optional) — Filter to threads whose recipients contain this value (substring match). Repeatable; all values must match.
- `subject` (list of string, optional) — Filter to threads whose subject contains this value (substring match). Repeatable; all values must match.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `threads` (list of object, required) — Ordered by `timestamp` descending.
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
- `limit` (integer, optional) — Limit of number of items returned.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "threads": [
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
    },
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
    await client.inboxes.threads.list("inbox_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.threads.list(
    inbox_id="inbox_id",
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/threads"

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/threads")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/inboxes/inbox_id/threads")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/inboxes/inbox_id/threads', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/threads");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/threads")! as URL,
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