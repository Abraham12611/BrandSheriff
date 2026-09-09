> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Update Inbox

PATCH https://api.agentmail.to/v0/pods/{pod_id}/inboxes/{inbox_id}
Content-Type: application/json

**CLI:**

```bash
agentmail pods inboxes update --pod-id <pod_id> --inbox-id <inbox_id>
```

Reference: https://docs.agentmail.to/api-reference/pods/inboxes/update

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
- `inbox_id` (string, required) — The ID of the inbox.

### Body (application/json)

- `display_name` (string, optional) — Display name: `Display Name <username@domain.com>`.
- `metadata` (map from string to string or double or boolean, optional, nullable) — Metadata to merge into the inbox's existing metadata. Keys you include are added or overwritten; keys you omit are left unchanged. To remove a single key, send it with a null value. To clear all metadata, send `metadata` as null. Sending an empty object is rejected; use null to clear. Each update must include at least one of `display_name` or `metadata`.

## Response

### 200

- `pod_id` (string, required) — ID of pod.
- `inbox_id` (string, required) — The ID of the inbox.
- `email` (string, required) — Email address of the inbox.
- `updated_at` (datetime, required) — Time at which inbox was last updated.
- `created_at` (datetime, required) — Time at which inbox was created.
- `display_name` (string, optional) — Display name: `Display Name <username@domain.com>`.
- `client_id` (string, optional) — Client ID of inbox.
- `metadata` (map from string to string or double or boolean, optional) — Custom metadata attached to the inbox.

## Examples

**Request**

```json
{}
```

**Response**

```json
{
  "pod_id": "pod_id",
  "inbox_id": "inbox_id",
  "email": "email",
  "updated_at": "2024-01-15T09:30:00Z",
  "created_at": "2024-01-15T09:30:00Z",
  "display_name": "display_name",
  "client_id": "client_id",
  "metadata": {
    "metadata": "metadata"
  }
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.pods.inboxes.update("pod_id", "inbox_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.pods.inboxes.update(
    pod_id="pod_id",
    inbox_id="inbox_id",
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

	url := "https://api.agentmail.to/v0/pods/pod_id/inboxes/inbox_id"

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

url = URI("https://api.agentmail.to/v0/pods/pod_id/inboxes/inbox_id")

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

HttpResponse<String> response = Unirest.patch("https://api.agentmail.to/v0/pods/pod_id/inboxes/inbox_id")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('PATCH', 'https://api.agentmail.to/v0/pods/pod_id/inboxes/inbox_id', [
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

var client = new RestClient("https://api.agentmail.to/v0/pods/pod_id/inboxes/inbox_id");
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

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/pods/pod_id/inboxes/inbox_id")! as URL,
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