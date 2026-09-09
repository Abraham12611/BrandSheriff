> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# List Browser Credential Events

GET https://api.agentmail.to/v0/api-keys/browser-credentials/events

List owner-facing browser credential and consent lifecycle events. Requires `api_key_read`.

Reference: https://docs.agentmail.to/api-reference/api-keys/list-browser-credential-events

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
- `events` (list of object or object, required)
  - Browser Enrollment Lifecycle Event
    - `type` (enum, required)
      - Allowed values: `browser_enrollment_intent_created`, `browser_credential_activated`, `browser_enrollment_cancelled`, `browser_credential_deleted`
    - `trace_id` (UUID, required)
    - `event_id` (UUID, required)
    - `occurred_at` (datetime, required)
    - `organization_id` (UUID, required)
    - `pod_id` (UUID, required)
    - `actor` (object, required)
      - `type`: `api_key`
        - `api_key_id` (UUID, required)
      - `type`: `browser_credential`
        - `authorizing_api_key_id` (UUID, required)
        - `credential_id` (UUID, required)
    - `enrollment_id` (UUID, required)
    - `credential_id` (UUID, required)
  - Browser Consent Lifecycle Event
    - `type` (enum, required)
      - Allowed values: `browser_consent_created`, `browser_consent_updated`, `browser_consent_reused`, `browser_consent_revoked`
    - `trace_id` (UUID, required)
    - `event_id` (UUID, required)
    - `occurred_at` (datetime, required)
    - `organization_id` (UUID, required)
    - `pod_id` (UUID, required)
    - `actor` (object, required)
      - `type`: `api_key`
        - `api_key_id` (UUID, required)
      - `type`: `browser_credential`
        - `authorizing_api_key_id` (UUID, required)
        - `credential_id` (UUID, required)
    - `consent_id` (string, required)
    - `client_type` ("closed", required)
    - `client_id` (string, required)
- `next_page_token` (string, optional) — Page token for pagination.

## Examples

**Response**

```json
{
  "count": 1,
  "limit": 100,
  "events": [
    {
      "type": "browser_enrollment_intent_created",
      "trace_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "event_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "occurred_at": "2024-01-15T09:30:00Z",
      "organization_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "pod_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "actor": {
        "type": "api_key",
        "api_key_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32"
      },
      "enrollment_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "credential_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32"
    },
    {
      "type": "browser_enrollment_intent_created",
      "trace_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "event_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "occurred_at": "2024-01-15T09:30:00Z",
      "organization_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "pod_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "actor": {
        "type": "api_key",
        "api_key_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32"
      },
      "enrollment_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32",
      "credential_id": "d5e9c84f-c2b2-4bf4-b4b0-7ffd7a9ffc32"
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
    await client.apiKeys.listBrowserCredentialEvents({});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.api_keys.list_browser_credential_events()

```

```go
package main

import (
	"fmt"
	"net/http"
	"io"
)

func main() {

	url := "https://api.agentmail.to/v0/api-keys/browser-credentials/events"

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

url = URI("https://api.agentmail.to/v0/api-keys/browser-credentials/events")

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

HttpResponse<String> response = Unirest.get("https://api.agentmail.to/v0/api-keys/browser-credentials/events")
  .header("Authorization", "Bearer <api_key>")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('GET', 'https://api.agentmail.to/v0/api-keys/browser-credentials/events', [
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/api-keys/browser-credentials/events");
var request = new RestRequest(Method.GET);
request.AddHeader("Authorization", "Bearer <api_key>");
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Authorization": "Bearer <api_key>"]

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/api-keys/browser-credentials/events")! as URL,
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