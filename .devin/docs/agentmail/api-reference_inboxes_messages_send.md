> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Send Message

POST https://api.agentmail.to/v0/inboxes/{inbox_id}/messages/send
Content-Type: application/json

**CLI:**

```bash
agentmail inboxes messages send --inbox-id <inbox_id> --to recipient@example.com --subject "Hello" --text "Body"
```

Reference: https://docs.agentmail.to/api-reference/inboxes/messages/send

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

- `labels` (list of string, optional) — Labels of message.
- `reply_to` (string or list of string, optional) — Reply-to address or addresses.
- `to` (string or list of string, optional) — Recipient address or addresses.
- `cc` (string or list of string, optional) — CC recipient address or addresses.
- `bcc` (string or list of string, optional) — BCC recipient address or addresses.
- `subject` (string, optional) — Subject of message.
- `text` (string, optional) — Plain text body of message.
- `html` (string, optional) — HTML body of message.
- `attachments` (list of object, optional) — Attachments to include in message.
  - `filename` (string, optional) — Filename of attachment.
  - `content_type` (string, optional) — Content type of attachment.
  - `content_disposition` (enum, optional) — Content disposition of attachment.
    - Allowed values: `inline`, `attachment`
  - `content_id` (string, optional) — Content ID of attachment.
  - `content` (string, optional) — Base64 encoded content of the attachment. The entire request, including the message body and all attachments, is limited to 6 MB.
  - `url` (string, optional) — URL that AgentMail can download without custom authentication headers or cookies. Redirects and pre-signed URLs are supported, and the final response must be a successful 2xx response. Keep URL-backed attachments around 30 MB total per message.
- `headers` (map from string to string, optional) — Headers to include in message.
- `track_opens` (boolean, optional) — Track when this message is first opened. Requires a custom domain with tracking enabled and an HTML body. Opens surface as the `opened` label on the message and as a `message.opened` event. One pixel is injected per message, not per recipient, so a message with several recipients fires once when any of them opens it, and the event does not identify which one.

## Response

### 200

- `message_id` (string, required) — ID of message.
- `thread_id` (string, required) — ID of thread.

## Examples

**Request**

```json
{}
```

**Response**

```json
{
  "message_id": "message_id",
  "thread_id": "thread_id"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.inboxes.messages.send("inbox_id", {});
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.inboxes.messages.send(
    inbox_id="inbox_id",
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

	url := "https://api.agentmail.to/v0/inboxes/inbox_id/messages/send"

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

url = URI("https://api.agentmail.to/v0/inboxes/inbox_id/messages/send")

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

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/inboxes/inbox_id/messages/send")
  .header("Authorization", "Bearer <api_key>")
  .header("Content-Type", "application/json")
  .body("{}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/inboxes/inbox_id/messages/send', [
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

var client = new RestClient("https://api.agentmail.to/v0/inboxes/inbox_id/messages/send");
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

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/inboxes/inbox_id/messages/send")! as URL,
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