> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Domains

GET https://api.agentmail.to/v0/pods/{pod_id}/domains

**CLI:**

```bash
agentmail pods domains list --pod-id <pod_id>
```

Reference: https://docs.agentmail.to/api-reference/pods/domains/list

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
- `domains` (list of object, required) — Ordered by `created_at` descending.
  - `domain_id` (string, required) — The ID of the domain.
  - `domain` (string, required) — The name of the domain (e.g., `example.com`).
  - `feedback_enabled` (boolean, required) — Bounce and complaint notifications are sent to your inboxes.
  - `subdomains_enabled` (boolean, required) — Allow inboxes on any subdomain of this domain. Adds a required wildcard MX record (`*.<domain>`) to `records`.
  - `tracking_enabled` (boolean, required) — Serve open tracking pixels from this domain. Adds a required `link.<domain>` CNAME record to `records`, which must be published and verified before `track_opens` can be used on a send.
  - `updated_at` (datetime, required) — Time at which the domain was last updated.
  - `created_at` (datetime, required) — Time at which the domain was created.
  - `pod_id` (string, optional) — ID of pod.
  - `client_id` (string, optional) — Client ID of domain.
- `limit` (integer, optional) — Limit of number of items returned.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "domains": [
    {
      "domain_id": "domain_id",
      "domain": "domain",
      "feedback_enabled": true,
      "subdomains_enabled": true,
      "tracking_enabled": true,
      "updated_at": "2024-01-15T09:30:00Z",
      "created_at": "2024-01-15T09:30:00Z",
      "pod_id": "pod_id",
      "client_id": "client_id"
    },
    {
      "domain_id": "domain_id",
      "domain": "domain",
      "feedback_enabled": true,
      "subdomains_enabled": true,
      "tracking_enabled": true,
      "updated_at": "2024-01-15T09:30:00Z",
      "created_at": "2024-01-15T09:30:00Z",
      "pod_id": "pod_id",
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
    await client.pods.domains.list("pod_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.pods.domains.list(
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

	url := "https://api.agentmail.to/v0/pods/pod_id/domains"

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

url = URI("https://api.agentmail.to/v0/pods/pod_id/domains")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/pods/pod_id/domains")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/pods/pod_id/domains', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/pods/pod_id/domains");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/pods/pod_id/domains")! as URL,
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