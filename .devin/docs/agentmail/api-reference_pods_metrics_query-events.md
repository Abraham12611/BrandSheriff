> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Query Events

GET https://api.agentmail.to/v0/pods/{pod_id}/metrics/events

Counts of email events (sent, delivered, bounced, etc.) over time for
the pod. Defaults to the last 24 hours; `start` must be within the last
90 days, and a future `end` is clamped to now. Omit `period` for
individual event counts, or set it to sum counts into buckets of that
many seconds.

**CLI:**

```bash
agentmail pods metrics query-events --pod-id <pod_id>
```

Reference: https://docs.agentmail.to/api-reference/pods/metrics/query-events

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

- `event_types` (list of enum, optional) — List of metric event types to query.
  - Allowed values: `message.received`, `message.received.spam`, `message.received.blocked`, `message.received.unauthenticated`, `message.sent`, `message.delivered`, `message.bounced`, `message.complained`, `message.rejected`, `domain.verified`
- `start` (datetime, optional) — Start timestamp for the query.
- `end` (datetime, optional) — End timestamp for the query.
- `period` (integer, optional) — Size of each time bucket as a whole number of seconds, between 1 and 86400.
- `limit` (integer, optional) — Limit on number of buckets to return.
- `descending` (boolean, optional) — Sort in descending order.

## Response

### 200

- `map from enum to list of object`
  - `timestamp` (datetime, required) — Timestamp of the bucket.
  - `count` (integer, required) — Count of events in the bucket.

## Examples

**Response**

```json
{
  "message.received": [
    {
      "timestamp": "2024-01-15T09:30:00Z",
      "count": 1
    },
    {
      "timestamp": "2024-01-15T09:30:00Z",
      "count": 1
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
    await client.pods.metrics.queryEvents("pod_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.pods.metrics.query_events(
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

	url := "https://api.agentmail.to/v0/pods/pod_id/metrics/events"

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

url = URI("https://api.agentmail.to/v0/pods/pod_id/metrics/events")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/pods/pod_id/metrics/events")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/pods/pod_id/metrics/events', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/pods/pod_id/metrics/events");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/pods/pod_id/metrics/events")! as URL,
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