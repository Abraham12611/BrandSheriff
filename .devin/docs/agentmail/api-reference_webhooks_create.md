> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Create Webhook

POST https://api.agentmail.to/v0/webhooks
Content-Type: application/json

**CLI:**
```bash
agentmail webhooks create --url https://example.com/webhook --event-types message.received
```

Reference: https://docs.agentmail.to/api-reference/webhooks/create

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Body (application/json)

- `event_types` (list of enum, required) — Full list of event types this webhook should receive. At least one type is required. Send every type you want in this array (not incremental). See [Webhooks overview](https://docs.agentmail.to/webhooks-overview) for spam, blocked, and unauthenticated events and required permissions.
  - Allowed values: `message.received`, `message.received.spam`, `message.received.blocked`, `message.received.unauthenticated`, `message.sent`, `message.delivered`, `message.bounced`, `message.complained`, `message.rejected`, `message.opened`, `domain.verified`
- `url` (string, required) — URL of webhook endpoint.
- `client_id` (string, optional) — Client ID of webhook.
- `headers` (map from string to string, optional) — Custom HTTP headers to include with every delivery to this webhook. Header values are write-only: AgentMail never returns them from webhook read endpoints. The map must contain at least one entry when provided, and every name and value must be a valid HTTP header.
- `inbox_ids` (list of string, optional) — Inboxes for which to send events. Maximum 10 per webhook.
- `pod_ids` (list of string, optional) — Pods for which to send events. Maximum 10 per webhook.

## Response

### 200

- `webhook_id` (string, required) — ID of webhook.
- `url` (string, required) — URL of webhook endpoint.
- `secret` (string, required) — Secret for webhook signature verification.
- `enabled` (boolean, required) — Webhook is enabled.
- `updated_at` (datetime, required) — Time at which webhook was last updated.
- `created_at` (datetime, required) — Time at which webhook was created.
- `event_types` (list of enum, optional) — Event types for which to send events.
  - Allowed values: `message.received`, `message.received.spam`, `message.received.blocked`, `message.received.unauthenticated`, `message.sent`, `message.delivered`, `message.bounced`, `message.complained`, `message.rejected`, `message.opened`, `domain.verified`
- `pod_ids` (list of string, optional) — Pods for which to send events. Maximum 10 per webhook.
- `inbox_ids` (list of string, optional) — Inboxes for which to send events. Maximum 10 per webhook.
- `client_id` (string, optional) — Client ID of webhook.

## Examples

**Request**

```json
{
  "event_types": [
    "message.received",
    "message.received"
  ],
  "url": "url"
}
```

**Response**

```json
{
  "webhook_id": "webhook_id",
  "url": "url",
  "secret": "secret",
  "enabled": true,
  "updated_at": "2024-01-15T09:30:00Z",
  "created_at": "2024-01-15T09:30:00Z",
  "event_types": [
    "message.received",
    "message.received"
  ],
  "pod_ids": [
    "pod_ids",
    "pod_ids"
  ],
  "inbox_ids": [
    "inbox_ids",
    "inbox_ids"
  ],
  "client_id": "client_id"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.webhooks.create({
        url: "url",
        eventTypes: [
            "message.received",
            "message.received",
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

client.webhooks.create(
    url="url",
    event_types=[
        "message.received",
        "message.received"
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

	url := "https://api.agentmail.to/v0/webhooks"

	payload := strings.NewReader("{\n  \"event_types\": [\n    \"message.received\",\n    \"message.received\"\n  ],\n  \"url\": \"url\"\n}")

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

url = URI("https://api.agentmail.to/v0/webhooks")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"event_types\": [\n    \"message.received\",\n    \"message.received\"\n  ],\n  \"url\": \"url\"\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/webhooks")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{\n  \"event_types\": [\n    \"message.received\",\n    \"message.received\"\n  ],\n  \"url\": \"url\"\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/webhooks', [
  'body' => '{
  "event_types": [
    "message.received",
    "message.received"
  ],
  "url": "url"
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

var client = new RestClient("https://api.agentmail.to/v0/webhooks");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"event_types\": [\n    \"message.received\",\n    \"message.received\"\n  ],\n  \"url\": \"url\"\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = [
  "event_types": ["message.received", "message.received"],
  "url": "url"
] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/webhooks")! as URL,
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