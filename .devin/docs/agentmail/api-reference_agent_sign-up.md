> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Sign Up

POST https://api.agentmail.to/v0/agent/sign-up
Content-Type: application/json

Create a new agent organization with an inbox and API key. This endpoint is for signing up for the first time. If you've already signed up, you're all set — just use your existing API key.

A 6-digit OTP is sent to the human's email for verification.

This endpoint is idempotent. Calling it again with the same `human_email` will rotate the API key and resend the OTP if expired.

The returned API key has limited permissions until the organization is verified via the verify endpoint.

**CLI:**
```bash
agentmail agent sign-up --human-email user@example.com --username my-agent
```

Reference: https://docs.agentmail.to/api-reference/agent/sign-up

## Servers

- `https://api.agentmail.to` (prod, default)
- `https://x402.api.agentmail.to` (prod-x402)
- `https://mpp.api.agentmail.to` (prod-mpp)
- `https://api.agentmail.eu` (eu-prod)

## Request

### Body (application/json)

- `human_email` (string, required) — Email address of the human who owns the agent. A 6-digit OTP will be sent to this address.
- `username` (string, required) — Username for the auto-created inbox (e.g. "my-agent" creates my-agent@agentmail.to).
- `source` (string, optional) — The SDK, framework, or platform issuing this sign-up (e.g. `agentmail-python`, `agentmail-cli`, `agentmail-mcp`). Identifies the caller — answers "who is signing up". Max 2048 characters.
- `referrer` (string, optional) — The channel that drove this sign-up — where the agent or its developer discovered AgentMail (e.g. `agent.email`, a partner URL, a campaign tag). Answers "where did this sign-up come from". Max 2048 characters.

## Response

### 200

- `organization_id` (string, required) — ID of the created organization.
- `inbox_id` (string, required) — ID of the auto-created inbox.
- `api_key` (string, required) — API key for authenticating subsequent requests. Store this securely, it cannot be retrieved again.

## Examples

**Request**

```json
{
  "human_email": "human_email",
  "username": "username"
}
```

**Response**

```json
{
  "organization_id": "organization_id",
  "inbox_id": "inbox_id",
  "api_key": "api_key"
}
```

**SDK Code**

```typescript
import { AgentMailClient } from "agentmail";

async function main() {
    const client = new AgentMailClient({
        apiKey: "YOUR_TOKEN_HERE",
    });
    await client.agent.signUp({
        humanEmail: "human_email",
        username: "username",
    });
}
main();

```

```python
from agentmail import AgentMail

client = AgentMail(
    api_key="YOUR_TOKEN_HERE",
)

client.agent.sign_up(
    human_email="human_email",
    username="username",
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

	url := "https://api.agentmail.to/v0/agent/sign-up"

	payload := strings.NewReader("{\n  \"human_email\": \"human_email\",\n  \"username\": \"username\"\n}")

	req, _ := http.NewRequest("POST", url, payload)

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

url = URI("https://api.agentmail.to/v0/agent/sign-up")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Content-Type"] = 'application/json'
request.body = "{\n  \"human_email\": \"human_email\",\n  \"username\": \"username\"\n}"

response = http.request(request)
puts response.read_body
```

```java
import com.mashape.unirest.http.HttpResponse;
import com.mashape.unirest.http.Unirest;

HttpResponse<String> response = Unirest.post("https://api.agentmail.to/v0/agent/sign-up")
  .header("Content-Type", "application/json")
  .body("{\n  \"human_email\": \"human_email\",\n  \"username\": \"username\"\n}")
  .asString();
```

```php
<?php
require_once('vendor/autoload.php');

$client = new \GuzzleHttp\Client();

$response = $client->request('POST', 'https://api.agentmail.to/v0/agent/sign-up', [
  'body' => '{
  "human_email": "human_email",
  "username": "username"
}',
  'headers' => [
    'Content-Type' => 'application/json',
  ],
]);

echo $response->getBody();
```

```csharp
using RestSharp;

var client = new RestClient("https://api.agentmail.to/v0/agent/sign-up");
var request = new RestRequest(Method.POST);
request.AddHeader("Content-Type", "application/json");
request.AddParameter("application/json", "{\n  \"human_email\": \"human_email\",\n  \"username\": \"username\"\n}", ParameterType.RequestBody);
IRestResponse response = client.Execute(request);
```

```swift
import Foundation

let headers = ["Content-Type": "application/json"]
let parameters = [
  "human_email": "human_email",
  "username": "username"
] as [String : Any]

let postData = JSONSerialization.data(withJSONObject: parameters, options: [])

let request = NSMutableURLRequest(url: NSURL(string: "https://api.agentmail.to/v0/agent/sign-up")! as URL,
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