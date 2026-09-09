> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Register Public-Key Credential

POST https://api.agentmail.to/v0/api-keys/public-keys
Content-Type: application/json

Register a public P-256 JWK using an existing AgentMail bearer API key
with `api_key_create`. Re-registering the same JWK creates a new
credential ID; it does not replace or recover an earlier credential.
The private key must never be sent to AgentMail.

Reference: https://docs.agentmail.to/api-reference/api-keys/create-public-key

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Body (application/json)

- `public_key` (object, required) — A public P-256 JWK. The object accepts exactly `kty`, `crv`, `x`, and `y`. Private key material such as `d`, embedded key IDs, and all other members are rejected. The server also rejects coordinates that are not a point on P-256.
  - `kty` ("EC", required)
  - `crv` ("P-256", required)
  - `x` (string, required) — A 32-byte P-256 coordinate encoded as unpadded base64url.
  - `y` (string, required) — A 32-byte P-256 coordinate encoded as unpadded base64url.
- `name` (string, optional) — Defaults to `AgentID key {first eight fingerprint characters}`.
- `scope` (object, optional) — Omit to inherit the registering bearer key's exact scope. An explicit scope must be the caller's scope or a live descendant.
  - `type`: `organization`
  - `type`: `pod`
    - `id` (UUID, required) — ID of the pod.
  - `type`: `inbox`
    - `id` (string, required) — ID of the inbox.
- `expires_at` (datetime, optional) — Future absolute expiry. Omit to inherit the registering bearer key's expiry. A child credential cannot outlive its creator.

## Response

### 200

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

## Examples

**Request**

```json
{
  "public_key": {
    "kty": "EC",
    "crv": "P-256",
    "x": "blackcurrant...............................",
    "y": "blackcurrant..............................."
  }
}
```

**Response**

```json
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
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.apiKeys.createPublicKey({
        publicKey: {
            kty: "EC",
            crv: "P-256",
            x: "blackcurrant...............................",
            y: "blackcurrant...............................",
        },
    });
}
main();

```

```python
from agentmail import AgentMail
from agentmail.api_keys import PublicJwk

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.api_keys.create_public_key(
    public_key=PublicJwk(
        kty="EC",
        crv="P-256",
        x="blackcurrant...............................",
        y="blackcurrant...............................",
    ),
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

	url := "https://api.agentmail.to/v0/api-keys/public-keys"

	payload := strings.NewReader("{\n  \"public_key\": {\n    \"kty\": \"EC\",\n    \"crv\": \"P-256\",\n    \"x\": \"blackcurrant...............................\",\n    \"y\": \"blackcurrant...............................\"\n  }\n}")

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

url = URI("https://api.agentmail.to/v0/api-keys/public-keys")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"public_key\": {\n    \"kty\": \"EC\",\n    \"crv\": \"P-256\",\n    \"x\": \"blackcurrant...............................\",\n    \"y\": \"blackcurrant...............................\"\n  }\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/api-keys/public-keys")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{\n  \"public_key\": {\n    \"kty\": \"EC\",\n    \"crv\": \"P-256\",\n    \"x\": \"blackcurrant...............................\",\n    \"y\": \"blackcurrant...............................\"\n  }\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/api-keys/public-keys', [
  'body' => '{
  "public_key": {
    "kty": "EC",
    "crv": "P-256",
    "x": "blackcurrant...............................",
    "y": "blackcurrant..............................."
  }
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

var client = new RestClient("https://api.agentmail.to/v0/api-keys/public-keys");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"public_key\": {\n    \"kty\": \"EC\",\n    \"crv\": \"P-256\",\n    \"x\": \"blackcurrant...............................\",\n    \"y\": \"blackcurrant...............................\"\n  }\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = ["public_key": [
    "kty": "EC",
    "crv": "P-256",
    "x": "blackcurrant...............................",
    "y": "blackcurrant..............................."
  ]] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/api-keys/public-keys")! as URL,
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