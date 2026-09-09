> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Public-Key Credentials

GET https://api.agentmail.to/v0/api-keys/public-keys

List only public-key credentials visible to the bearer caller's scope.
Bearer credentials are never returned, even though both credential types
share storage and pagination indexes. Requires `api_key_read`.

Reference: https://docs.agentmail.to/api-reference/api-keys/list-public-keys

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Query parameters

- `limit` (integer, optional) — Limit of number of items returned.
- `page_token` (string, optional) — Page token for pagination.
- `ascending` (boolean, optional) — Sort in ascending temporal order.

## Response

### 200

- `count` (integer, required) — Number of items returned.
- `public_keys` (list of object, required) — Public-key credentials only, ordered by creation time descending by default.
  - `api_key_id` (UUID, required) — Server-generated credential ID. Store this value as the signing key's `kid`.
  - `type` ("public_key", required) — Server-owned credential discriminator. Callers cannot select or update it.
  - `name` (string, required) — Human-readable credential name.
  - `public_key` (object, required) — Registered public key material and its server-computed RFC 7638 thumbprint.
    - `jwk` (object, required) — A public P-256 JWK. The object accepts exactly `kty`, `crv`, `x`, and `y`. Private key material such as `d`, embedded key IDs, and all other members are rejected. The server also rejects coordinates that are not a point on P-256.
      - `kty` ("EC", required)
      - `crv` ("P-256", required)
      - `x` (string, required) — A 32-byte P-256 coordinate encoded as unpadded base64url.
      - `y` (string, required) — A 32-byte P-256 coordinate encoded as unpadded base64url.
    - `fingerprint` (string, required) — RFC 7638 SHA-256 JWK thumbprint encoded as unpadded base64url.
  - `scope` (object, required) — The immutable scope in which a public-key credential can approve AgentID sign-in.
    - `type`: `organization`
    - `type`: `pod`
      - `id` (UUID, required) — ID of the pod.
    - `type`: `inbox`
      - `id` (string, required) — ID of the inbox.
  - `created_at` (datetime, required)
  - `updated_at` (datetime, required)
  - `expires_at` (datetime, optional) — Immutable absolute expiry. Omitted when the credential does not expire.
  - `revoked_at` (datetime, optional) — Present when organization-wide revoke-all invalidated this credential generation.
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "public_keys": [
    {
      "api_key_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "type": "public_key",
      "name": "name",
      "public_key": {
        "jwk": {
          "kty": "EC",
          "crv": "P-256",
          "x": "blackcurrant...............................",
          "y": "blackcurrant..............................."
        },
        "fingerprint": "blackcurrant..............................."
      },
      "scope": {
        "type": "organization"
      },
      "created_at": "2024-01-15T09:30:00Z",
      "updated_at": "2024-01-15T09:30:00Z",
      "expires_at": "2024-01-15T09:30:00Z",
      "revoked_at": "2024-01-15T09:30:00Z"
    },
    {
      "api_key_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "type": "public_key",
      "name": "name",
      "public_key": {
        "jwk": {
          "kty": "EC",
          "crv": "P-256",
          "x": "blackcurrant...............................",
          "y": "blackcurrant..............................."
        },
        "fingerprint": "blackcurrant..............................."
      },
      "scope": {
        "type": "organization"
      },
      "created_at": "2024-01-15T09:30:00Z",
      "updated_at": "2024-01-15T09:30:00Z",
      "expires_at": "2024-01-15T09:30:00Z",
      "revoked_at": "2024-01-15T09:30:00Z"
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
    await client.apiKeys.listPublicKeys({});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.api_keys.list_public_keys()

```

```go
package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://api.agentmail.to/v0/api-keys/public-keys"

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

url = URI("https://api.agentmail.to/v0/api-keys/public-keys")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/api-keys/public-keys")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/api-keys/public-keys', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/api-keys/public-keys");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/api-keys/public-keys")! as URL,
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