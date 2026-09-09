> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Update Webhook

PATCH https://api.agentmail.to/v0/webhooks/{webhook_id}
Content-Type: application/json

Update inbox or pod subscriptions, or replace the webhook's `event_types` in full when you pass a
non-empty `event_types` array (see request field docs). Inbox and pod changes use add/remove lists.

**CLI:**

```bash
agentmail webhooks update --webhook-id <webhook_id> --add-inbox-ids <inbox_id>
```

Reference: https://docs.agentmail.to/api-reference/webhooks/update

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `webhook_id` (string, required) — ID of webhook.

### Body (application/json)

- `add_inbox_ids` (list of string, optional) — Inbox IDs to subscribe to the webhook.
- `add_pod_ids` (list of string, optional) — Pod IDs to subscribe to the webhook.
- `event_types` (list of enum, optional) — When you send a non-empty list, it replaces the webhook's subscribed event types in full (the same "set the list" behavior as create). It is not a merge or diff: include every event type you want after the update. Sending a one-element array means the webhook will only receive that one type afterward. Omit this field or send an empty array to leave event types unchanged. Clearing all types with an empty list is not supported. Subscribing to `message.received.spam`, `message.received.blocked`, or `message.received.unauthenticated` requires the matching label permission on the API key.
  - Allowed values: `message.received`, `message.received.spam`, `message.received.blocked`, `message.received.unauthenticated`, `message.sent`, `message.delivered`, `message.bounced`, `message.complained`, `message.rejected`, `message.opened`, `domain.verified`
- `remove_inbox_ids` (list of string, optional) — Inbox IDs to unsubscribe from the webhook.
- `remove_pod_ids` (list of string, optional) — Pod IDs to unsubscribe from the webhook.

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
{}
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
    await client.webhooks.update("webhook_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.webhooks.update(
    webhook_id="webhook_id",
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

	url := "https://api.agentmail.to/v0/webhooks/webhook_id"

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

url = URI("https://api.agentmail.to/v0/webhooks/webhook_id")

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

HttpResponse<String> response = Unirest.patch("https://api.agentmail.to/v0/webhooks/webhook_id")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('PATCH', 'https://api.agentmail.to/v0/webhooks/webhook_id', [
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

var client = new RestClient("https://api.agentmail.to/v0/webhooks/webhook_id");
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

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/webhooks/webhook_id")! as URL,
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