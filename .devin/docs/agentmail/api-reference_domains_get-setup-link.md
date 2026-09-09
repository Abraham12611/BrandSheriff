> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Get Setup Link

GET https://api.agentmail.to/v0/domains/{domain_id}/setup-link

Build a one-click DNS setup link for the domain via the Domain Connect standard. When the domain's DNS provider supports Domain Connect and carries the AgentMail template, the response contains a signed URL: opening it lets the domain owner approve the required DNS records at their provider, which writes them automatically — no copy-paste. When the provider does not support it, `supported` is `false` and the domain's `records` should be added manually instead.

Reference: https://docs.agentmail.to/api-reference/domains/get-setup-link

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `domain_id` (string, required) — The ID of the domain.

## Response

### 200

- `supported` (boolean, required) — Whether one-click setup is available for this domain. `false` means the domain's DNS provider does not support Domain Connect (or does not carry the AgentMail template yet) — add the domain's `records` manually instead.
- `provider_name` (string, optional) — Display name of the domain's DNS provider, for the setup button label.
- `url` (string, optional) — The signed Domain Connect apply URL. Open it in a browser: the domain owner signs in at their DNS provider, reviews the records, and approves — the provider writes them.
- `width` (integer, optional) — Suggested popup width from the provider, in pixels.
- `height` (integer, optional) — Suggested popup height from the provider, in pixels.
- `state` (string, optional) — Opaque value echoed back on the provider's redirect. Store it before opening the URL and compare on return to tie the redirect to this request.
- `conflicting_provider` (string, optional) — Set when the domain currently has another email provider's MX records (for example Google Workspace). Applying the template would replace them — warn before proceeding.

## Examples

**Response**

```json
{
  "supported": true,
  "provider_name": "provider_name",
  "url": "url",
  "width": 1,
  "height": 1,
  "state": "state",
  "conflicting_provider": "conflicting_provider"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.domains.getSetupLink("domain_id");
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.domains.get_setup_link(
    domain_id="domain_id",
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

	url := "https://api.agentmail.to/v0/domains/domain_id/setup-link"

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

url = URI("https://api.agentmail.to/v0/domains/domain_id/setup-link")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/domains/domain_id/setup-link")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/domains/domain_id/setup-link', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/domains/domain_id/setup-link");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/domains/domain_id/setup-link")! as URL,
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