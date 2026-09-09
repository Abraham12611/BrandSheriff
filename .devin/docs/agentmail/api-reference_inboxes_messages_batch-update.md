> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Batch Update Messages

POST https://api.agentmail.to/v0/inboxes/{inbox_id}/messages/batch-update
Content-Type: application/json

Apply one label change to up to 50 messages in a single request. The
same add\_labels and remove\_labels apply to every message id, and at
least one of them must be provided. The update is atomic: either all
resolved messages are updated or none are. Missing or restricted ids
are silently excluded; compare `count` against `limit` to detect
exclusions.

**CLI:**

```bash
agentmail inboxes messages batch-update --inbox-id <inbox_id> --message-ids <id1> --message-ids <id2> --add-labels read --remove-labels unread
```

Reference: https://docs.agentmail.to/api-reference/inboxes/messages/batch-update

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

- `message_ids` (list of string, required) — IDs of messages to update. Maximum 50 ids per request. Duplicates are rejected with a validation error. IDs not found in the inbox (including cross-inbox or permission-restricted) are silently excluded from the update; callers detect exclusions by comparing `count` against `limit`.
- `add_labels` (string or list of string, optional) — Label or labels to add to every message.
- `remove_labels` (string or list of string, optional) — Label or labels to remove from every message.

## Response

### 200

- `limit` (integer, required) — Limit of number of items returned.
- `count` (integer, required) — Number of items returned.
- `updates` (list of object, required) — Updated messages with their new labels. Order matches `message_ids` in the request. Excluded ids are omitted, so `count` may be less than `limit`.
  - `message_id` (string, required) — ID of message.
  - `labels` (list of string, required) — Labels of message.

## Examples

**Request**

```json
{
  "message_ids": [
    "message_ids",
    "message_ids"
  ]
}
```

**Response**

```json
{
  "limit": 1,
  "count": 1,
  "updates": [
    {
      "message_id": "message_id",
      "labels": [
        "labels",
        "labels"
      ]
    },
    {
      "message_id": "message_id",
      "labels": [
        "labels",
        "labels"
      ]
    }
  ]
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.inboxes.messages.batchUpdate("inbox_id", {
        messageIds: [
            "message_ids",
            "message_ids",
        ],
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.messages.batch_update(
    inbox_id="inbox_id",
    message_ids=[
        "message_ids",
        "message_ids"
    ],
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-update"

	payload := strings.NewReader("{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}")

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-update")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Authorization"] = 'Bearer <api_key>'
request["Content-Type"] = 'application/json'
request.body = "{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-update")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-update', [
  'body' => '{
  "message_ids": [
    "message_ids",
    "message_ids"
  ]
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

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-update");
var request = new RestRequest(Method.POST);
request.AddHeader("Authorization", "Bearer <api_key>");
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"message_ids\": [\n    \"message_ids\",\n    \"message_ids\"\n  ]\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = [
  "Authorization": "Bearer <api_key>",
  "Content-Type": "application/json"
]
let parameters = ["message_ids": ["message_ids", "message_ids"]] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/messages/batch-update")! as URL,
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