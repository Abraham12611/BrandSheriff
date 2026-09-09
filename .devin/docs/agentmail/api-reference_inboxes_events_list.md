> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Inbox Events

GET https://api.agentmail.to/v0/inboxes/{inbox_id}/events

List label change events for an inbox. Returns events in reverse chronological order by default. Use for IMAP UID projection or audit logging.

**CLI:**

```bash
agentmail inboxes events list --inbox-id <inbox_id>
```

Reference: https://docs.agentmail.to/api-reference/inboxes/events/list

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
- `ascending` (boolean, optional) — Sort in ascending temporal order.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `events` (list of object, required) — Ordered by `event_id` descending.
  - `organization_id` (string, required) — ID of organization.
  - `pod_id` (string, required) — ID of pod.
  - `inbox_id` (string, required) — The ID of the inbox.
  - `event_id` (string, required) — ID of event.
  - `event_type` (enum, required) — Type of inbox event. Wire format is dot.case to match the convention used by webhook events (`message.received`, `domain.verified`, etc. in events.yml). Pre-2026-04 these were `label_added`/`label_removed` (snake_case). The Fern enum's `name` field stays uppercase-snake (Fern convention); only the wire `value` changed.
    - Allowed values: `label.added`, `label.removed`
  - `message_id` (string, required) — ID of message.
  - `label` (string, required) — Label added or removed.
  - `event_at` (datetime, required) — Time at which the event occurred.
  - `created_at` (datetime, required) — Time at which the event was recorded.
- `limit` (integer, optional) — Limit of number of items returned.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "events": [
    {
      "organization_id": "organization_id",
      "pod_id": "pod_id",
      "inbox_id": "inbox_id",
      "event_id": "event_id",
      "event_type": "label.added",
      "message_id": "message_id",
      "label": "label",
      "event_at": "2024-01-15T09:30:00Z",
      "created_at": "2024-01-15T09:30:00Z"
    },
    {
      "organization_id": "organization_id",
      "pod_id": "pod_id",
      "inbox_id": "inbox_id",
      "event_id": "event_id",
      "event_type": "label.added",
      "message_id": "message_id",
      "label": "label",
      "event_at": "2024-01-15T09:30:00Z",
      "created_at": "2024-01-15T09:30:00Z"
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
    await client.inboxes.events.list("inbox_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.events.list(
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/events"

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/events")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/inboxes/inbox_id/events")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/inboxes/inbox_id/events', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/events");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/events")! as URL,
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