> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Delete Browser Credential

DELETE https://api.agentmail.to/v0/api-keys/browser-credentials/{credential_id}

Permanently revoke one active browser credential. Requires `api_key_delete`.

Reference: https://docs.agentmail.to/api-reference/api-keys/delete-browser-credential

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `credential_id` (UUID, required)

## Examples

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.apiKeys.deleteBrowserCredential("d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32");
}
main();

```

```python
from agentmail import AgentMail
import uuid

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.api_keys.delete_browser_credential(
    credential_id=uuid.UUID("d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32"),
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

	url := "https://api.agentmail.to/v0/api-keys/browser-credentials/d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32"

	req, _ := http.NewRequest("DELETE", url, nil)

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

url = URI("https://api.agentmail.to/v0/api-keys/browser-credentials/d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Delete.new(url)
request["Authorization"] = 'Bearer <api_key>'

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.delete("https://api.agentmail.to/v0/api-keys/browser-credentials/d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('DELETE', 'https://api.agentmail.to/v0/api-keys/browser-credentials/d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/api-keys/browser-credentials/d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32");
var request = new RestRequest(Method.DELETE);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/api-keys/browser-credentials/d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "DELETE"
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