> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Drafts

GET https://api.agentmail.to/v0/inboxes/{inbox_id}/drafts

**CLI:**

```bash
agentmail inboxes drafts list --inbox-id <inbox_id>
```

Reference: https://docs.agentmail.to/api-reference/inboxes/drafts/list

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

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `drafts` (list of object, required) — Ordered by `updated_at` descending.
  - `inbox_id` (string, required) — The ID of the inbox.
  - `draft_id` (string, required) — ID of draft.
  - `labels` (list of string, required) — Labels of draft.
  - `updated_at` (datetime, required) — Time at which draft was last updated.
  - `to` (list of string, optional) — Addresses of recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `cc` (list of string, optional) — Addresses of CC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `bcc` (list of string, optional) — Addresses of BCC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
  - `subject` (string, optional) — Subject of draft.
  - `preview` (string, optional) — Text preview of draft.
  - `attachments` (list of object, optional) — Attachments in draft.
    - `attachment_id` (string, required) — ID of attachment.
    - `size` (integer, required) — Size of attachment in bytes.
    - `filename` (string, optional) — Filename of attachment.
    - `content_type` (string, optional) — Content type of attachment.
    - `content_disposition` (enum, optional) — Content disposition of attachment.
      - Allowed values: `inline`, `attachment`
    - `content_id` (string, optional) — Content ID of attachment.
  - `in_reply_to` (string, optional) — ID of message being replied to.
  - `forward_of` (string, optional) — ID of message being forwarded.
  - `send_status` (enum, optional) — Schedule send status of draft.
    - Allowed values: `scheduled`, `sending`, `failed`
  - `send_at` (datetime, optional) — Time at which to schedule send draft.
- `limit` (integer, optional) — Limit of number of items returned.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "drafts": [
    {
      "inbox_id": "inbox_id",
      "draft_id": "draft_id",
      "labels": [
        "labels",
        "labels"
      ],
      "updated_at": "2024-01-15T09:30:00Z",
      "to": [
        "to",
        "to"
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
      "forward_of": "forward_of",
      "send_status": "scheduled",
      "send_at": "2024-01-15T09:30:00Z"
    },
    {
      "inbox_id": "inbox_id",
      "draft_id": "draft_id",
      "labels": [
        "labels",
        "labels"
      ],
      "updated_at": "2024-01-15T09:30:00Z",
      "to": [
        "to",
        "to"
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
      "forward_of": "forward_of",
      "send_status": "scheduled",
      "send_at": "2024-01-15T09:30:00Z"
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
    await client.inboxes.drafts.list("inbox_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.drafts.list(
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/drafts"

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/drafts")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/inboxes/inbox_id/drafts")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/inboxes/inbox_id/drafts', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/drafts");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/drafts")! as URL,
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