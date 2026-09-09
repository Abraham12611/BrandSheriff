> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Update Domain

PATCH https://api.agentmail.to/v0/pods/{pod_id}/domains/{domain_id}
Content-Type: application/json

**CLI:**

```bash
agentmail pods domains update --pod-id <pod_id> --domain-id <domain_id>
```

Reference: https://docs.agentmail.to/api-reference/pods/domains/update

## Authentication

- `Authorization` header (bearer token, required)

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Path parameters

- `pod_id` (string, required) — ID of pod.
- `domain_id` (string, required) — The ID of the domain.

### Body (application/json)

- `feedback_enabled` (boolean, optional) — Bounce and complaint notifications are sent to your inboxes.
- `subdomains_enabled` (boolean, optional) — Allow inboxes on any subdomain of this domain. Adds a required wildcard MX record (`*.<domain>`) to `records`.
- `tracking_enabled` (boolean, optional) — Serve open tracking pixels from this domain. Adds a required `link.<domain>` CNAME record to `records`, which must be published and verified before `track_opens` can be used on a send.

## Response

### 200

- `domain_id` (string, required) — The ID of the domain.
- `domain` (string, required) — The name of the domain (e.g., `example.com`).
- `status` (enum, required) — The verification status of the domain.
  - Allowed values: `NOT_STARTED`, `PENDING`, `INVALID`, `FAILED`, `VERIFYING`, `VERIFIED`
- `feedback_enabled` (boolean, required) — Bounce and complaint notifications are sent to your inboxes.
- `subdomains_enabled` (boolean, required) — Allow inboxes on any subdomain of this domain. Adds a required wildcard MX record (`*.<domain>`) to `records`.
- `tracking_enabled` (boolean, required) — Serve open tracking pixels from this domain. Adds a required `link.<domain>` CNAME record to `records`, which must be published and verified before `track_opens` can be used on a send.
- `records` (list of object, required) — A list of DNS records required to verify the domain. Includes a wildcard MX record (`*.<domain>`) when `subdomains_enabled` is true.
  - `type` (enum, required) — The type of the DNS record.
    - Allowed values: `TXT`, `CNAME`, `MX`
  - `name` (string, required) — The name or host of the record.
  - `value` (string, required) — The value of the record.
  - `status` (enum, required) — The verification status of this specific record.
    - Allowed values: `MISSING`, `INVALID`, `VALID`
  - `priority` (integer, optional) — The priority of the MX record.
  - `reason` (string, optional) — Why the record is INVALID, when known. `duplicate_records` means the expected value is present but extra records coexist at the same name; `value_mismatch` means a record exists but does not match the expected value.
- `updated_at` (datetime, required) — Time at which the domain was last updated.
- `created_at` (datetime, required) — Time at which the domain was created.
- `pod_id` (string, optional) — ID of pod.
- `reason` (string, optional) — Why the domain is not (yet) VERIFIED, when known. `dns_records_missing` / `dns_records_invalid` point at the DNS records. The `ses_*` values mean the records look right and sending-infrastructure validation has not converged: `ses_dkim_pending` / `ses_mail_from_pending` (still checking), `ses_dkim_temporary_failure` / `ses_mail_from_temporary_failure` (a transient error the infrastructure keeps retrying on its own — usually resolves without changes), `ses_dkim_failed` / `ses_mail_from_failed` (a terminal verdict; re-verify after fixing), `ses_dkim_not_started` / `ses_mail_from_not_started` (the attribute was never configured on the identity — re-verify to push it), and `ses_not_verified_for_sending`. Absent when VERIFIED.
- `client_id` (string, optional) — Client ID of domain.

## Examples

**Request**

```json
{}
```

**Response**

```json
{
  "domain_id": "domain_id",
  "domain": "domain",
  "status": "NOT_STARTED",
  "feedback_enabled": true,
  "subdomains_enabled": true,
  "tracking_enabled": true,
  "records": [
    {
      "type": "TXT",
      "name": "name",
      "value": "value",
      "status": "MISSING",
      "priority": 1,
      "reason": "reason"
    },
    {
      "type": "TXT",
      "name": "name",
      "value": "value",
      "status": "MISSING",
      "priority": 1,
      "reason": "reason"
    }
  ],
  "updated_at": "2024-01-15T09:30:00Z",
  "created_at": "2024-01-15T09:30:00Z",
  "pod_id": "pod_id",
  "reason": "reason",
  "client_id": "client_id"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.pods.domains.update("pod_id", "domain_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.pods.domains.update(
    pod_id="pod_id",
    domain_id="domain_id",
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

	url := "https://api.agentmail.to/v0/pods/pod_id/domains/domain_id"

	payload := strings.NewReader("{}")

	req, _ := http.NewRequest("PATCH", url, payload)

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

url = URI("https://api.agentmail.to/v0/pods/pod_id/domains/domain_id")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Patch.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.patch("https://api.agentmail.to/v0/pods/pod_id/domains/domain_id")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('PATCH', 'https://api.agentmail.to/v0/pods/pod_id/domains/domain_id', [
  'body' => '{}',
  'headers' => [
    'Authorization' => 'Bearer <api_key>',
    'Content-Type' => 'application/json',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/pods/pod_id/domains/domain_id");
var request = new RestRequest(Method.PATCH);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = [] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/pods/pod_id/domains/domain_id")! as URL,
                                        cachePolicy: .useProtocolCachePolicy,
                                    timeoutInterval: 10.0)
request.httpMethod = "PATCH"
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