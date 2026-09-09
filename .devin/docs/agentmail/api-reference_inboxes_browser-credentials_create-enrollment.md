> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Create Browser Enrollment

POST https://api.agentmail.to/v0/inboxes/{inbox_id}/browser-credentials/enrollments
Content-Type: application/json

Attach a browser enrollment intent to the inbox. Requires
`api_key_create`. Before submitting `transaction_jti`, independently
verify that the browser page's final origin is exactly
`https://auth.agentid.com`.

This endpoint is available to every organization using US production.
It is not available in EU production.

Select `inbox_id` from trusted AgentMail configuration. An AgentID
`login_hint` is not authoritative for selecting the inbox; when the
transaction includes one, it must match the path inbox.

**AgentMail API keys are sent only to `https://api.agentmail.to`; AgentID never requests them.**

A new intent returns `202`; an idempotent retry for the same pending
transaction, inbox, and bearer key returns `200` with the same receipt.
An intent lasts at most five minutes. An activated credential lasts at
most 30 days and cannot outlive its authorizing bearer API key.

Creation is limited to 20 intents per bearer API key per hour, 100 per
organization per hour, and five live unused intents per bearer API key.
Browser activation is separately limited to 20 activations per
authorizing bearer API key per UTC day. Either kind of limit can return
`429`; honor the `Retry-After` header. Cancelling an enrollment releases
its live-intent slot but does not reset the daily activation counter.

Reference: https://docs.agentmail.to/api-reference/inboxes/browser-credentials/create-enrollment

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `inbox_id` (string, required) — The ID of the inbox.

### Body (application/json)

- `transaction_jti` (string, required) — Transaction identifier read from an enrollment action on exactly `https://auth.agentid.com`.

## Response

### 202

- `status` ("pending", required)
- `enrollment_id` (UUID, required)
- `expires_at` (integer, required) — Unix timestamp after which the pending enrollment cannot be activated.

## Examples

**Request**

```json
{
  "transaction_jti": "blackcurrant.........."
}
```

**Response**

```json
{
  "status": "pending",
  "enrollment_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
  "expires_at": 1
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.inboxes.browserCredentials.createEnrollment("inbox_id", {
        transactionJti: "blackcurrant..........",
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.browser_credentials.create_enrollment(
    inbox_id="inbox_id",
    transaction_jti="blackcurrant..........",
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/browser-credentials/enrollments"

	payload := strings.NewReader("{\n  \"transaction_jti\": \"blackcurrant..........\"\n}")

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/browser-credentials/enrollments")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"transaction_jti\": \"blackcurrant..........\"\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/inboxes/inbox_id/browser-credentials/enrollments")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{\n  \"transaction_jti\": \"blackcurrant..........\"\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/inboxes/inbox_id/browser-credentials/enrollments', [
  'body' => '{
  "transaction_jti": "blackcurrant.........."
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

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/browser-credentials/enrollments");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"transaction_jti\": \"blackcurrant..........\"\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = ["transaction_jti": "blackcurrant.........."] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/browser-credentials/enrollments")! as URL,
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