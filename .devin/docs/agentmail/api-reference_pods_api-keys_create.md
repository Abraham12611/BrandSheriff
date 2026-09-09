> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Create API Key

POST https://api.agentmail.to/v0/pods/{pod_id}/api-keys
Content-Type: application/json

**CLI:**

```bash
agentmail pods api-keys create --pod-id <pod_id> --name "My Key"
```

Reference: https://docs.agentmail.to/api-reference/pods/api-keys/create

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

### Body (application/json)

- `name` (string, optional) — Name of api key.
- `permissions` (object, optional) — Granular permissions for the API key. When ommitted all permissions are granted. Otherwise, only permissions set to true are granted.
  - `inbox_read` (boolean, optional) — Read inbox details.
  - `inbox_create` (boolean, optional) — Create new inboxes.
  - `inbox_update` (boolean, optional) — Update inbox settings.
  - `inbox_delete` (boolean, optional) — Delete inboxes.
  - `message_read` (boolean, optional) — Read messages. Also required to read threads.
  - `message_send` (boolean, optional) — Send messages.
  - `message_update` (boolean, optional) — Update message labels. Also required to update threads.
  - `message_delete` (boolean, optional) — Delete messages. Also required to delete threads.
  - `label_spam_read` (boolean, optional) — Access messages labeled spam.
  - `label_blocked_read` (boolean, optional) — Access messages labeled blocked.
  - `label_unauthenticated_read` (boolean, optional) — Access messages labeled unauthenticated.
  - `label_trash_read` (boolean, optional) — Access messages labeled trash.
  - `draft_read` (boolean, optional) — Read drafts.
  - `draft_create` (boolean, optional) — Create drafts.
  - `draft_update` (boolean, optional) — Update drafts.
  - `draft_delete` (boolean, optional) — Delete drafts.
  - `draft_send` (boolean, optional) — Send drafts.
  - `webhook_read` (boolean, optional) — Read webhook configurations.
  - `webhook_create` (boolean, optional) — Create webhooks.
  - `webhook_update` (boolean, optional) — Update webhooks.
  - `webhook_delete` (boolean, optional) — Delete webhooks.
  - `domain_read` (boolean, optional) — Read domain details.
  - `domain_create` (boolean, optional) — Create domains.
  - `domain_update` (boolean, optional) — Update domains.
  - `domain_delete` (boolean, optional) — Delete domains.
  - `list_entry_read` (boolean, optional) — Read list entries.
  - `list_entry_create` (boolean, optional) — Create list entries.
  - `list_entry_delete` (boolean, optional) — Delete list entries.
  - `metrics_read` (boolean, optional) — Read metrics.
  - `api_key_read` (boolean, optional) — Read API keys.
  - `api_key_create` (boolean, optional) — Create API keys.
  - `api_key_update` (boolean, optional) — Update API keys.
  - `api_key_delete` (boolean, optional) — Delete API keys.
  - `pod_read` (boolean, optional) — Read pods.
  - `pod_create` (boolean, optional) — Create pods.
  - `pod_delete` (boolean, optional) — Delete pods.

## Response

### 200

- `api_key_id` (string, required) — ID of api key.
- `api_key` (string, required) — API key.
- `prefix` (string, required) — Prefix of api key.
- `name` (string, required) — Name of api key.
- `created_at` (datetime, required) — Time at which api key was created.
- `pod_id` (string, optional) — Pod ID the api key is scoped to.
- `inbox_id` (string, optional) — Inbox ID the api key is scoped to.
- `permissions` (object, optional) — Granular permissions for the API key. When ommitted all permissions are granted. Otherwise, only permissions set to true are granted.
  - `inbox_read` (boolean, optional) — Read inbox details.
  - `inbox_create` (boolean, optional) — Create new inboxes.
  - `inbox_update` (boolean, optional) — Update inbox settings.
  - `inbox_delete` (boolean, optional) — Delete inboxes.
  - `message_read` (boolean, optional) — Read messages. Also required to read threads.
  - `message_send` (boolean, optional) — Send messages.
  - `message_update` (boolean, optional) — Update message labels. Also required to update threads.
  - `message_delete` (boolean, optional) — Delete messages. Also required to delete threads.
  - `label_spam_read` (boolean, optional) — Access messages labeled spam.
  - `label_blocked_read` (boolean, optional) — Access messages labeled blocked.
  - `label_unauthenticated_read` (boolean, optional) — Access messages labeled unauthenticated.
  - `label_trash_read` (boolean, optional) — Access messages labeled trash.
  - `draft_read` (boolean, optional) — Read drafts.
  - `draft_create` (boolean, optional) — Create drafts.
  - `draft_update` (boolean, optional) — Update drafts.
  - `draft_delete` (boolean, optional) — Delete drafts.
  - `draft_send` (boolean, optional) — Send drafts.
  - `webhook_read` (boolean, optional) — Read webhook configurations.
  - `webhook_create` (boolean, optional) — Create webhooks.
  - `webhook_update` (boolean, optional) — Update webhooks.
  - `webhook_delete` (boolean, optional) — Delete webhooks.
  - `domain_read` (boolean, optional) — Read domain details.
  - `domain_create` (boolean, optional) — Create domains.
  - `domain_update` (boolean, optional) — Update domains.
  - `domain_delete` (boolean, optional) — Delete domains.
  - `list_entry_read` (boolean, optional) — Read list entries.
  - `list_entry_create` (boolean, optional) — Create list entries.
  - `list_entry_delete` (boolean, optional) — Delete list entries.
  - `metrics_read` (boolean, optional) — Read metrics.
  - `api_key_read` (boolean, optional) — Read API keys.
  - `api_key_create` (boolean, optional) — Create API keys.
  - `api_key_update` (boolean, optional) — Update API keys.
  - `api_key_delete` (boolean, optional) — Delete API keys.
  - `pod_read` (boolean, optional) — Read pods.
  - `pod_create` (boolean, optional) — Create pods.
  - `pod_delete` (boolean, optional) — Delete pods.

## Examples

**Request**

```json
{}
```

**Response**

```json
{
  "api_key_id": "api_key_id",
  "api_key": "api_key",
  "prefix": "prefix",
  "name": "name",
  "created_at": "2024-01-15T09:30:00Z",
  "pod_id": "pod_id",
  "inbox_id": "inbox_id",
  "permissions": {
    "inbox_read": true,
    "inbox_create": true,
    "inbox_update": true,
    "inbox_delete": true,
    "message_read": true,
    "message_send": true,
    "message_update": true,
    "message_delete": true,
    "label_spam_read": true,
    "label_blocked_read": true,
    "label_unauthenticated_read": true,
    "label_trash_read": true,
    "draft_read": true,
    "draft_create": true,
    "draft_update": true,
    "draft_delete": true,
    "draft_send": true,
    "webhook_read": true,
    "webhook_create": true,
    "webhook_update": true,
    "webhook_delete": true,
    "domain_read": true,
    "domain_create": true,
    "domain_update": true,
    "domain_delete": true,
    "list_entry_read": true,
    "list_entry_create": true,
    "list_entry_delete": true,
    "metrics_read": true,
    "api_key_read": true,
    "api_key_create": true,
    "api_key_update": true,
    "api_key_delete": true,
    "pod_read": true,
    "pod_create": true,
    "pod_delete": true
  }
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.pods.apiKeys.create("pod_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.pods.api_keys.create(
    pod_id="pod_id",
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

	url := "https://api.agentmail.to/v0/pods/pod_id/api-keys"

	payload := strings.NewReader("{}")

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

url = URI("https://api.agentmail.to/v0/pods/pod_id/api-keys")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/pods/pod_id/api-keys")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/pods/pod_id/api-keys', [
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

var client = new RestClient("https://api.agentmail.to/v0/pods/pod_id/api-keys");
var request = new RestRequest(Method.POST);
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

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/pods/pod_id/api-keys")! as URL,
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