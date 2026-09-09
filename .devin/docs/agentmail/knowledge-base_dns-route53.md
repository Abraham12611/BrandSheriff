> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# DNS Guide: Route 53 (AWS)

## Steps

1. Log in to the [AWS Management Console](https://console.aws.amazon.com)
2. Navigate to **Route 53**, then select **Hosted Zones**
3. Click on your domain's hosted zone
4. Click **Create Record** for each record AgentMail requires

If your domain is registered with a different registrar but uses Route 53 for DNS, make sure the NS records at your registrar match the name servers listed in your hosted zone.

## Adding a TXT Record (SPF)

| Field       | Value                                                |
| ----------- | ---------------------------------------------------- |
| Record name | Leave blank for root domain, or enter your subdomain |
| Record type | `TXT`                                                |
| Value       | `"v=spf1 include:agentmail.to ~all"`                 |
| TTL         | `300`                                                |

Route 53 requires TXT values to be **wrapped in double quotes**. If you omit the quotes, the record will fail validation. Also, if you already have an SPF record, add `include:agentmail.to` to the existing record rather than creating a second one. Multiple SPF records on the same domain will cause authentication failures.

## Adding a TXT Record (DKIM)

| Field       | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| Record name | The DKIM selector host from AgentMail (e.g., `selector._domainkey`) |
| Record type | `TXT`                                                               |
| Value       | The quoted DKIM TXT value from AgentMail                            |
| TTL         | `300`                                                               |

Route 53 requires TXT values to be **wrapped in double quotes**. If a DKIM TXT value is longer than 255 characters, split it into adjacent quoted strings within one TXT record.

Legacy orgs should keep existing working DNS records in place. For new domain setup, add the TXT selector records shown in AgentMail.

## Adding an MX Record (Receiving)

| Field       | Value                                                |
| ----------- | ---------------------------------------------------- |
| Record name | Leave blank for root domain, or enter your subdomain |
| Record type | `MX`                                                 |
| Value       | `10 inbound.agentmail.to`                            |
| TTL         | `300`                                                |

Route 53 MX records use the format `priority server` separated by a space (e.g., `10 inbound.agentmail.to`). Do not wrap MX values in quotes.

If you want to receive emails on a subdomain to avoid conflicts with your existing email provider, enter the subdomain in the Record name field instead of leaving it blank.

## Verification

After adding all records, go back to the [AgentMail Console](https://console.agentmail.to) and click **Verify Domain**.

Route 53 name servers typically pick up changes within **60 seconds**, but full propagation to all DNS resolvers may take longer depending on TTL and resolver caching. In practice, most changes are visible within a few minutes.

## Common Route 53 Issues

* **TXT records must be quoted:** Unlike most DNS providers, Route 53 requires double quotes around TXT record values. If your SPF, DKIM, or DMARC TXT records are missing quotes, they won't validate.

* **Existing SPF record:** If you already have a TXT record starting with `v=spf1`, add `include:agentmail.to` before the `~all` or `-all` in that existing record. Do not create a second SPF TXT record.

* **Routing policy:** When creating records, use **Simple routing** unless you have a specific reason to use weighted, latency, or other routing policies. Other policies can cause unexpected DNS behavior for email records.

* **Multiple values in one record:** Route 53 lets you add multiple values to a single record. If you need to add a second MX entry, add it as a new line in the same MX record rather than creating a separate record.

* **DKIM TXT record too long (CharacterStringTooLong error):** DKIM public keys are often longer than the 255-character limit that Route 53 enforces per string segment. You will see an error like `CharacterStringTooLong (Value is too long)`. To fix this, split the value into two quoted strings within a single record. The split point should be near the middle of the `p=` value. The two quoted strings must have **no space and no line break** between the closing and opening quotes. For example:

  ```
  "v=DKIM1; k=rsa; p=MIIBIjANBgkqhki...firsthalf""secondhalf...wIDAQAB"
  ```

  In Route 53, paste the entire value (both quoted strings) into the **Value** field as a single entry. If Route 53 shows two separate copy-pastable values instead of one, there is likely a space or line break between the two strings. Remove it so the closing `"` and opening `"` are directly adjacent (`""`).

  **Incorrect:** A space or line break between the two quoted strings causes Route 53 to treat them as separate values.

  ![Incorrect Route 53 DKIM configuration with space between quoted strings](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/5145d22514b03251934e96ef49b78f8ca79e6b20bfa7ec5065a343ac547338e9/assets/route53-dkim-incorrect.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164602Z&X-Amz-Expires=604800&X-Amz-Signature=a9311dd82e93c02647866d2ec3349a16c23568e4aea23818895e188841479c79&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

  **Correct:** The two quoted strings are directly adjacent with no space, producing a single value in Route 53.

  ![Correct Route 53 DKIM configuration with no space between quoted strings](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/d67b72b3e23c286ef81bb101c57098bab684785fca4bf3791fd7f0fffe864740/assets/route53-dkim-correct.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164602Z&X-Amz-Expires=604800&X-Amz-Signature=27a0dfec2c32e888a802e7b7967251f4f3deb826cea4d491604b1e166031e30c&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

  You can also use the AWS CLI to add the record, which handles multi-string TXT values more reliably.