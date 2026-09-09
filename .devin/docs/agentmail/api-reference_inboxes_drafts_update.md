> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Update Draft

PATCH https://api.agentmail.to/v0/inboxes/{inbox_id}/drafts/{draft_id}
Content-Type: application/json

Edit fields on an existing draft. Passing `null` clears a field (or `[]`
for a recipient field); `send_at: null` un-schedules a scheduled draft.
A draft that is already being sent cannot be edited.

**CLI:**

```bash
agentmail inboxes drafts update --inbox-id <inbox_id> --draft-id <draft_id> --subject "Updated subject"
```

Reference: https://docs.agentmail.to/api-reference/inboxes/drafts/update

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
- `draft_id` (string, required) — ID of draft.

### Body (application/json)

- `reply_to` (list of string, optional, nullable) — Reply-to addresses. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `to` (list of string, optional, nullable) — Addresses of recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `cc` (list of string, optional, nullable) — Addresses of CC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `bcc` (list of string, optional, nullable) — Addresses of BCC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `subject` (string, optional, nullable) — Subject of draft.
- `text` (string, optional, nullable) — Plain text body of draft.
- `html` (string, optional, nullable) — HTML body of draft.
- `add_attachments` (list of object, optional) — Attachments to add to the draft.
  - `filename` (string, optional) — Filename of attachment.
  - `content_type` (string, optional) — Content type of attachment.
  - `content_disposition` (enum, optional) — Content disposition of attachment.
    - Allowed values: `inline`, `attachment`
  - `content_id` (string, optional) — Content ID of attachment.
  - `content` (string, optional) — Base64 encoded content of the attachment. The entire request, including the message body and all attachments, is limited to 6 MB.
  - `url` (string, optional) — URL that AgentMail can download without custom authentication headers or cookies. Redirects and pre-signed URLs are supported, and the final response must be a successful 2xx response. Keep URL-backed attachments around 30 MB total per message.
- `remove_attachments` (list of string, optional) — IDs of attachments to remove from the draft.
- `add_labels` (list of string, optional) — Label or labels to add to the draft.
- `remove_labels` (list of string, optional) — Label or labels to remove from the draft.
- `send_at` (datetime, optional, nullable) — Time at which to schedule send draft.

## Response

### 200

- `inbox_id` (string, required) — The ID of the inbox.
- `draft_id` (string, required) — ID of draft.
- `labels` (list of string, required) — Labels of draft.
- `updated_at` (datetime, required) — Time at which draft was last updated.
- `created_at` (datetime, required) — Time at which draft was created.
- `client_id` (string, optional) — Client ID of draft.
- `reply_to` (list of string, optional) — Reply-to addresses. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `to` (list of string, optional) — Addresses of recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `cc` (list of string, optional) — Addresses of CC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `bcc` (list of string, optional) — Addresses of BCC recipients. In format `username@domain.com` or `Display Name <username@domain.com>`.
- `subject` (string, optional) — Subject of draft.
- `preview` (string, optional) — Text preview of draft.
- `text` (string, optional) — Plain text body of draft.
- `html` (string, optional) — HTML body of draft.
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
- `references` (list of string, optional) — IDs of previous messages in thread.
- `send_status` (enum, optional) — Schedule send status of draft.
  - Allowed values: `scheduled`, `sending`, `failed`
- `send_at` (datetime, optional) — Time at which to schedule send draft.

## Examples

**Request**

```json
{}
```

**Response**

```json
{
  "inbox_id": "inbox_id",
  "draft_id": "draft_id",
  "labels": [
    "labels",
    "labels"
  ],
  "updated_at": "2024-01-15T09:30:00Z",
  "created_at": "2024-01-15T09:30:00Z",
  "client_id": "client_id",
  "reply_to": [
    "reply_to",
    "reply_to"
  ],
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
  "text": "text",
  "html": "html",
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
  "references": [
    "references",
    "references"
  ],
  "send_status": "scheduled",
  "send_at": "2024-01-15T09:30:00Z"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.inboxes.drafts.update("inbox_id", "draft_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.drafts.update(
    inbox_id="inbox_id",
    draft_id="draft_id",
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/drafts/draft_id"

	payload := strings.NewReader("{}")

	req, _ := http.NewRequest("PATCH", url, payload)

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/drafts/draft_id")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Patch.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.patch("https://api.agentmail.to/v0/inboxes/inbox_id/drafts/draft_id")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('PATCH', 'https://api.agentmail.to/v0/inboxes/inbox_id/drafts/draft_id', [
  'body' => '{}',
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
    'Content-Type' => 'application/json',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/drafts/draft_id");
var request = new RestRequest(Method.PATCH);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = [] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/drafts/draft_id")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "PATCH"
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