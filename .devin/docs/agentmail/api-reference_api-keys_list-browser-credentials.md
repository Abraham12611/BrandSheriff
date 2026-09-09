> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Browser Credentials

GET https://api.agentmail.to/v0/api-keys/browser-credentials

List active browser credentials visible to the caller's scope. Requires `api_key_read`.

Reference: https://docs.agentmail.to/api-reference/api-keys/list-browser-credentials

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Query parameters

- `limit` (integer, optional)
- `page_token` (string, optional) — Page token for pagination.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `limit` (integer, required)
- `credentials` (list of object, required)
  - `credential_id` (UUID, required)
  - `public_key_fingerprint_prefix` (string, required)
  - `organization_id` (UUID, required)
  - `pod_id` (UUID, required)
  - `inbox_id` (string, required)
  - `created_by` (object, required)
    - `kind` ("bearer_api_key", required)
    - `api_key_id` (UUID, required) — Bearer API key that authorized creation of the browser credential.
    - `created_at` (datetime, required) — Incarnation timestamp of the authorizing bearer API key.
  - `created_at` (datetime, required)
  - `expires_at` (datetime, required)
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "limit": 100,
  "credentials": [
    {
      "credential_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "public_key_fingerprint_prefix": "mandarin",
      "organization_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "pod_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "inbox_id": "inbox_id",
      "created_by": {
        "kind": "bearer_api_key",
        "api_key_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
        "created_at": "2024-01-15T09:30:00Z"
      },
      "created_at": "2024-01-15T09:30:00Z",
      "expires_at": "2024-01-15T09:30:00Z"
    },
    {
      "credential_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "public_key_fingerprint_prefix": "mandarin",
      "organization_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "pod_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "inbox_id": "inbox_id",
      "created_by": {
        "kind": "bearer_api_key",
        "api_key_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
        "created_at": "2024-01-15T09:30:00Z"
      },
      "created_at": "2024-01-15T09:30:00Z",
      "expires_at": "2024-01-15T09:30:00Z"
    }
  ],
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
    await client.apiKeys.listBrowserCredentials({});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.api_keys.list_browser_credentials()

```

```go
package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://api.agentmail.to/v0/api-keys/browser-credentials"

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

url = URI("https://api.agentmail.to/v0/api-keys/browser-credentials")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/api-keys/browser-credentials")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/api-keys/browser-credentials', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/api-keys/browser-credentials");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/api-keys/browser-credentials")! as URL,
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