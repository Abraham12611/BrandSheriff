> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Webhooks

GET https://api.agentmail.to/v0/pods/{pod_id}/webhooks

**CLI:**

```bash
agentmail pods webhooks list --pod-id <pod_id>
```

Reference: https://docs.agentmail.to/api-reference/pods/webhooks/list

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `pod_id` (string, required) — ID of pod.

### Query parameters

- `limit` (integer, optional) — Limit of number of items returned.
- `page_token` (string, optional) — Page token for pagination.
- `ascending` (boolean, optional) — Sort in ascending temporal order.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `webhooks` (list of object, required) — Ordered by `created_at` descending.
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
- `limit` (integer, optional) — Limit of number of items returned.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "webhooks": [
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
    },
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
    await client.pods.webhooks.list("pod_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.pods.webhooks.list(
    pod_id="pod_id",
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

	url := "https://api.agentmail.to/v0/pods/pod_id/webhooks"

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

url = URI("https://api.agentmail.to/v0/pods/pod_id/webhooks")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/pods/pod_id/webhooks")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/pods/pod_id/webhooks', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/pods/pod_id/webhooks");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/pods/pod_id/webhooks")! as URL,
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