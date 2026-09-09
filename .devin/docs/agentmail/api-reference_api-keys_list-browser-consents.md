> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Browser Consents

GET https://api.agentmail.to/v0/api-keys/browser-consents

List remembered AgentID client approvals for one live inbox. Requires `api_key_read`.

Reference: https://docs.agentmail.to/api-reference/api-keys/list-browser-consents

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Query parameters

- `inbox_id` (string, required)
- `limit` (integer, optional)
- `page_token` (string, optional) — Page token for pagination.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `limit` (integer, required)
- `consents` (list of object, required)
  - `consent_id` (string, required)
  - `inbox_id` (string, required)
  - `client_type` ("closed", required)
  - `client_id` (string, required)
  - `approved_scopes` (list of string, required) — At least one non-empty scope approved for this client.
  - `created_at` (datetime, required)
  - `updated_at` (datetime, required)
  - `expires_at` (datetime, required)
  - `client_url` (string, optional) — Registered client URL, when one is available.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "limit": 100,
  "consents": [
    {
      "consent_id": "blackcurrant....................................",
      "inbox_id": "inbox_id",
      "client_type": "closed",
      "client_id": "x",
      "approved_scopes": [
        "approved_scopes",
        "approved_scopes"
      ],
      "created_at": "2024-01-15T09:30:00Z",
      "updated_at": "2024-01-15T09:30:00Z",
      "expires_at": "2024-01-15T09:30:00Z",
      "client_url": "client_url"
    },
    {
      "consent_id": "blackcurrant....................................",
      "inbox_id": "inbox_id",
      "client_type": "closed",
      "client_id": "x",
      "approved_scopes": [
        "approved_scopes",
        "approved_scopes"
      ],
      "created_at": "2024-01-15T09:30:00Z",
      "updated_at": "2024-01-15T09:30:00Z",
      "expires_at": "2024-01-15T09:30:00Z",
      "client_url": "client_url"
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
    await client.apiKeys.listBrowserConsents({
        inboxId: "inbox_id",
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.api_keys.list_browser_consents(
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

	url := "https://api.agentmail.to/v0/api-keys/browser-consents?inbox_id=inbox_id"

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

url = URI("https://api.agentmail.to/v0/api-keys/browser-consents?inbox_id=inbox_id")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/api-keys/browser-consents?inbox_id=inbox_id")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/api-keys/browser-consents?inbox_id=inbox_id', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/api-keys/browser-consents?inbox_id=inbox_id");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/api-keys/browser-consents?inbox_id=inbox_id")! as URL,
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