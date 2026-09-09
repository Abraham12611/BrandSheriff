> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Revoke All AgentID Sign-In Keys

POST https://api.agentmail.to/v0/api-keys/public-keys/agentid-sign-in/revoke-all

Invalidate every current public-key credential in the caller's
organization by advancing its AgentID key generation. The caller must be
organization-scoped and either have `api_key_delete` or, for a verified
self-serve agent organization, use an unrestricted unmanaged bearer
credential. No request body is accepted.

`Idempotency-Key` is required and must be a UUID. Reusing the same UUID
returns the original permanent receipt without advancing the generation
again. A new UUID performs a new generation advance.

Reference: https://docs.agentmail.to/api-reference/api-keys/revoke-all-agent-id-sign-in-keys

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Headers

- `Idempotency-Key` (string, required) — Required UUID identifying this revoke-all operation permanently.

## Response

### 200

- `previous_generation` (integer, required)
- `current_generation` (integer, required)
- `revoked_at` (datetime, required)

## Examples

**Response**

```json
{
  "previous_generation": 1,
  "current_generation": 1,
  "revoked_at": "2024-01-15T09:30:00Z"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.apiKeys.revokeAllAgentIdSignInKeys({
        idempotencyKey: "Idempotency-Key",
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.api_keys.revoke_all_agent_id_sign_in_keys(
    idempotency_key="Idempotency-Key",
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

	url := "https://api.agentmail.to/v0/api-keys/public-keys/agentid-sign-in/revoke-all"

	req, _ := http.NewRequest("POST", url, nil)

	req.Header.Add("Idempotency-Key", "Idempotency-Key")
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

url = URI("https://api.agentmail.to/v0/api-keys/public-keys/agentid-sign-in/revoke-all")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Idempotency-Key"] = 'Idempotency-Key'
request["Authorization"] = 'Bearer <api_key>'

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/api-keys/public-keys/agentid-sign-in/revoke-all")
  .header("Idempotency-Key", "Idempotency-Key")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/api-keys/public-keys/agentid-sign-in/revoke-all', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
    'Idempotency-Key' => 'Idempotency-Key',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/api-keys/public-keys/agentid-sign-in/revoke-all");
var request = new RestRequest(Method.POST);
request.AddHeader("Idempotency-Key", "Idempotency-Key");
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Idempotency-Key": "Idempotency-Key",
  "Authorization": "Bearer <api_key>"
]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/api-keys/public-keys/agentid-sign-in/revoke-all")! as URL,
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