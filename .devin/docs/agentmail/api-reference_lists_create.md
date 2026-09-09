> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Create List Entry

POST https://api.agentmail.to/v0/lists/{direction}/{type}
Content-Type: application/json

**CLI:**

```bash
agentmail lists create --direction <direction> --type <type> --entry user@example.com
```

Reference: https://docs.agentmail.to/api-reference/lists/create

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `direction` (enum, required) — Direction of list entry.
  - Allowed values: `send`, `receive`, `reply`
- `type` (enum, required) — Type of list entry.
  - Allowed values: `allow`, `block`

### Body (application/json)

- `entry` (string, required) — Email address or domain to add.
- `reason` (string, optional) — Reason for adding the entry.

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
- `read_only` (boolean, optional) — Whether the entry is read-only and cannot be deleted via the API.
- `reason` (string, optional) — Reason for adding the entry.

## Examples

**Request**

```json
{
  "entry": "entry"
}
```

**Response**

```json
{
  "created_at": "2024-01-15T09:30:00Z",
  "direction": "send",
  "entry": "entry",
  "entry_type": "email",
  "list_type": "allow",
  "organization_id": "organization_id",
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
    await client.lists.create("send", "allow", {
        entry: "entry",
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.lists.create(
    direction="send",
    type="allow",
    entry="entry",
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

	url := "https://api.agentmail.to/v0/lists/send/allow"

	payload := strings.NewReader("{\n  \"entry\": \"entry\"\n}")

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

url = URI("https://api.agentmail.to/v0/lists/send/allow")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"entry\": \"entry\"\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/lists/send/allow")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{\n  \"entry\": \"entry\"\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/lists/send/allow', [
  'body' => '{
  "entry": "entry"
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

var client = new RestClient("https://api.agentmail.to/v0/lists/send/allow");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"entry\": \"entry\"\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = ["entry": "entry"] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/lists/send/allow")! as URL,
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