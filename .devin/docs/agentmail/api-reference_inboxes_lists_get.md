> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Get List Entry

GET https://api.agentmail.to/v0/inboxes/{inbox_id}/lists/{direction}/{type}/{entry}

**CLI:**

```bash
agentmail inboxes lists get --inbox-id <inbox_id> --direction <direction> --type <type> --entry <entry>
```

Reference: https://docs.agentmail.to/api-reference/inboxes/lists/get

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
- `direction` (enum, required) — Direction of list entry.
  - Allowed values: `send`, `receive`, `reply`
- `type` (enum, required) — Type of list entry.
  - Allowed values: `allow`, `block`
- `entry` (string, required) — Email address or domain.

## Response

### 200

- `created_at` (datetime, required) — Time at which entry was created.
- `direction` (enum, required) — Direction of list entry.
  - Allowed values: `send`, `receive`, `reply`
- `entry` (string, required) — Email address or domain of list entry.
- `entry_type` (enum, required) — Whether the entry is an email address or domain.
  - Allowed values: `email`, `domain`
- `list_type` (enum, required) — Type of list entry.
  - Allowed values: `allow`, `block`
- `organization_id` (string, required) — ID of organization.
- `pod_id` (string, required) — ID of pod.
- `inbox_id` (string, optional) — ID of inbox, if entry is inbox-scoped.
- `read_only` (boolean, optional) — Whether the entry is read-only and cannot be deleted via the API.
- `reason` (string, optional) — Reason for adding the entry.

## Examples

**Response**

```json
{
  "created_at": "2024-01-15T09:30:00Z",
  "direction": "send",
  "entry": "entry",
  "entry_type": "email",
  "list_type": "allow",
  "organization_id": "organization_id",
  "pod_id": "pod_id",
  "inbox_id": "inbox_id",
  "read_only": true,
  "reason": "reason"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.inboxes.lists.get("inbox_id", "send", "allow", "entry");
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.lists.get(
    inbox_id="inbox_id",
    direction="send",
    type="allow",
    entry="entry",
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/lists/send/allow/entry"

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/lists/send/allow/entry")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/inboxes/inbox_id/lists/send/allow/entry")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/inboxes/inbox_id/lists/send/allow/entry', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/lists/send/allow/entry");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/lists/send/allow/entry")! as URL,
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