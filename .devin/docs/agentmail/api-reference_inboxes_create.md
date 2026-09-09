> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Create Inbox

POST https://api.agentmail.to/v0/inboxes
Content-Type: application/json

**CLI:**
```bash
agentmail inboxes create --display-name "My Agent" --username myagent --domain agentmail.to
```

Reference: https://docs.agentmail.to/api-reference/inboxes/create

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Body (application/json)

- `username` (string, optional) — Username of address. Randomly generated if not specified.
- `domain` (string, optional) — Domain of address. Must be a verified domain, or any subdomain of a verified domain that has subdomains enabled (e.g., `bot.example.com`). Defaults to `agentmail.to`.
- `display_name` (string, optional) — Display name: `Display Name <username@domain.com>`.
- `client_id` (string, optional) — Client ID of inbox.
- `metadata` (map from string to string or double or boolean, optional) — Custom metadata to attach to the inbox.

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
undefined
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
    await client.inboxes.create();
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.create()

```

```go
package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://api.agentmail.to/v0/inboxes"

	req, _ := http.NewRequest("POST", url, nil)

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

url = URI("https://api.agentmail.to/v0/inboxes")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/inboxes")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/inboxes', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/inboxes");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "POST"
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