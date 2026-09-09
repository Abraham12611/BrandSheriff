> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Entries

GET https://api.agentmail.to/v0/lists/{direction}/{type}

**CLI:**

```bash
agentmail lists list --direction <direction> --type <type>
```

Reference: https://docs.agentmail.to/api-reference/lists/list

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

### Query parameters

- `limit` (integer, optional) — Limit of number of items returned.
- `page_token` (string, optional) — Page token for pagination.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `entries` (list of object, required) — Ordered by entry ascending.
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
- `limit` (integer, optional) — Limit of number of items returned.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "entries": [
    {
      "created_at": "2024-01-15T09:30:00Z",
      "direction": "send",
      "entry": "entry",
      "entry_type": "email",
      "list_type": "allow",
      "organization_id": "organization_id",
      "read_only": true,
      "reason": "reason"
    },
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
    await client.lists.list("send", "allow", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.lists.list(
    direction="send",
    type="allow",
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

	url := "https://api.agentmail.to/v0/lists/send/allow"

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

url = URI("https://api.agentmail.to/v0/lists/send/allow")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/lists/send/allow")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/lists/send/allow', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/lists/send/allow");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/lists/send/allow")! as URL,
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