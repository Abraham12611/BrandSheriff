> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Who Am I

GET https://api.agentmail.to/v0/auth/me

Returns the identity and scope of the authenticated credential. Useful when a client holds a pod-scoped or inbox-scoped API key and needs to discover the parent organization, pod, or inbox without prior knowledge.

**CLI:**
```bash
agentmail auth me
```

Reference: https://docs.agentmail.to/api-reference/auth/me

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Response

### 200

- `scope_type` (enum, required) — The scope tier the authenticated credential is bound to.
  - Allowed values: `organization`, `pod`, `inbox`
- `scope_id` (string, required) — ID of the most specific scope the credential is bound to. Equals inbox_id when scope_type is inbox, pod_id when pod, organization_id when organization.
- `organization_id` (string, required) — ID of organization.
- `pod_id` (string, optional) — ID of the pod the credential is scoped to. Present when scope_type is pod or inbox.
- `inbox_id` (string, optional) — ID of the inbox the credential is scoped to. Present when scope_type is inbox.
- `api_key_id` (string, optional) — ID of the API key used to authenticate. Absent for JWT and proxy credentials.

## Examples

**Response**

```json
{
  "scope_type": "organization",
  "scope_id": "scope_id",
  "organization_id": "organization_id",
  "pod_id": "pod_id",
  "inbox_id": "inbox_id",
  "api_key_id": "api_key_id"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.auth.me();
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.auth.me()

```

```go
package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://api.agentmail.to/v0/auth/me"

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

url = URI("https://api.agentmail.to/v0/auth/me")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/auth/me")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/auth/me', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/auth/me");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/auth/me")! as URL,
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