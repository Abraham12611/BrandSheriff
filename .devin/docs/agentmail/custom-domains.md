> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Using Custom Domains

> A step-by-step guide to configuring your custom domain with AgentMail for enhanced branding and trust.

## Why Use a Custom Domain?

When you're deploying AI agents that send email at scale, deliverability and trust are paramount. While the default `@agentmail.to` domain is great for getting started, using your own custom domains is essential for production applications. It gives you control over your sending reputation and enables advanced strategies for high-volume outreach.

#### Improved Deliverability

Each domain builds its own sending reputation. By using your own domain, you
control this reputation, which is the single most important factor in
reaching the inbox.

#### Scale with Multiple Domains

For high-volume sending, register multiple domains (e.g., `mercor.com`,
`usemercor.com`, `mercorapp.com`). Spreading email volume across them is a
key strategy to maximize deliverability.

## Setting Up Your Custom Domain

Configuring your domain is a three-step process: add the domain via API, copy the provided records into your DNS provider, and wait for verification.

#### 1. Create Domain & Get DNS Records

Choose your preferred method to create a domain and get the required DNS records. AgentMail will register your domain and immediately return the full set of DNS records required for verification.

#### Console

Navigate to the [AgentMail Console](https://console.agentmail.to) and follow these steps:

1. **Go to Domains Section**: Click on "Domains" in the left sidebar
2. **Add New Domain**: Click "Add Domain" or "Create Domain" button
3. **Enter Domain Name**: Type your domain name (e.g., `your-domain.com`)
4. **Create Domain**: Click "Create" to register the domain

#### SDK

```bash title="cURL"
curl -X POST https://api.agentmail.to/domains/your-domain.com \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

```python title="Python"
from agentmail import AgentMail

client = AgentMail(api_key="YOUR_API_KEY")

# Create domain with default settings
domain = client.domains.create("your-domain.com")

# Or with custom feedback forwarding
domain = client.domains.create(
  "your-domain.com",
  feedback_enabled=False
)

print("Domain created:", domain)
print("DNS Records:", domain.records)
```

```typescript title="TypeScript"
import { AgentMailClient } from "agentmail";

const client = new AgentMailClient({
  apiKey: "YOUR_API_KEY",
});

// Create domain with default settings
const domain = await client.domains.create("your-domain.com");

// Or with custom feedback forwarding
const domain = await client.domains.create("your-domain.com", {
  feedback_enabled: false
});

console.log("Domain created:", domain);
console.log("DNS Records:", domain.records);
```

```bash title="CLI"
# create domain with default settings
agentmail domains create --domain your-domain.com
```

#### Idempotent Requests

You can make these requests idempotent by including a `client_id`
attribute in the request so we dont serve an error if you try and create a
domain that has already been registered with us.

#### Feedback Forwarding

By default, bounce and complaint notifications are sent to your domain. You
can disable this by setting `feedback_enabled` to `false` in your request. If
not specified it is default set to `true`

The API response includes a `records` array. Each object in this array contains the precise `name`, `type`, `value`, and `priority` you'll need to add to your DNS provider.

The initial `status` of the domain will be `pending`. It will change as you configure your domain and we verify it on our end.

#### 2. Add Records to Your DNS Provider

The process for adding records varies slightly between providers. The examples below assume you are configuring records in the apex `domain.com` hosted zone. If you are using a subdomain make sure it is in the apex domain hosted zone.

### Option A: Upload BIND Zone File (Easiest)

A BIND zone file is a text file that contains DNS resource records in a standardized format. This approach allows you to bulk upload our records to your DNS provider without you needing to go down one by one.

**How to use the BIND zone file:**

**Step 1: Download the BIND zone file**

After creating your domain in the AgentMail Console, click the "Download BIND Zone File" button to get the complete zone file.

![Download BIND Zone File from Console](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/faac7775a4d3462c040390f8427b67a3d0ab59a811489e773739e6c973418123/assets/download-zone-file.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164449Z&X-Amz-Expires=604800&X-Amz-Signature=a654fa46335fd29b922670f23c1f7c0de47aed7c8d703f013b2ab59dd2f72bcd&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

#### Cloudflare

**Step 2: Import to Cloudflare**

1. Go to your Cloudflare dashboard and select your domain
2. Navigate to **DNS > Records**

![Cloudflare BIND Import](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/96c7605681eb665155d04a7df0a8cd58830fe147270cabdec3b05797cb993899/assets/cloudflare-dns.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164449Z&X-Amz-Expires=604800&X-Amz-Signature=ea4badd520e2700b70663576d536ba25346eef0faf31a89d5d646d64115bcbd6&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

3. Click **"Import and Export"**

![Cloudflare BIND Import](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/05cc3ce3579576efb2e81419b9a3f66d79c1cd5b0ec684d070b55762ffade22a/assets/cloudflare-import-export.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164449Z&X-Amz-Expires=604800&X-Amz-Signature=ff7c7007977e8ed7b9cb12e00e5ef90b52e159144def01165bce218aae88d2b7&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

4. Upload the downloaded BIND zone file as is

#### AWS Route 53

**Step 2: Import to Route 53**

1. Go to your Route 53 hosted zone for your domain
2. Click **"Import zone file"** in the top right corner

![AWS Route 53 BIND Import](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/036c4079abf5da1f8f4bb3aaa5b444b59f0be8077b4f2c3e718746aff5c06751/assets/aws-bind-import.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164449Z&X-Amz-Expires=604800&X-Amz-Signature=641ddba9c954b18be0f216ea1a12afa1e9e6a62234ea8765741a2c04941d869b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

3. Paste the CONTENTS of downloaded BIND zone file

![AWS Route 53 BIND Import](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/0ddc3eaa3744f03f776a832f09d236312b33a0c8f40d1804a84e70c75a3b5896/assets/aws-paste.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164449Z&X-Amz-Expires=604800&X-Amz-Signature=fce76a6743a5437d6939b12b73aed7320a57e86f0ff2269e0c997d514b1f5165&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

4. Review the records and click **"Import"**

#### CRITICAL: Route 53 TXT Record 255 Character Limit

**AWS Route 53 has a 255 character maximum per string.** It will get angry at the DKIM record since it is longer than 255 chars (we use more secure encryption key so we get better deliverability with Gmail!)

**When entering TXT values in the Route 53 UI, you MUST do the following.**

1. Split the value into two quoted strings.
   a. e.g.: "abcd" -> "ab""cd"
2. Ensure there is NO SPACE between the quoted strings. This will make or break validation.

**Correct:** `"first-part-of-value""second-part-of-value"`

**Wrong:** `"first-part-of-value" "second-part-of-value"` (space between strings)

If you accidentally include a space or click enter, Route 53 will create **two separate TXT records** instead of one concatenated record. This will cause email authentication to fail, and providers like **Gmail will reject your emails**.

#### Porkbun

**Step 2: Import to Porkbun**

1. Go to your Porkbun profile and click domain management
2. Navigate to the **DNS** subtab of the domain you want to send from

![Porkbun DNS Management](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/e4ed50d2d850209bc7eaba74f70e49de1e236816cf9a8b0ee1a244c76dee2714/assets/porkbun-dns.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164449Z&X-Amz-Expires=604800&X-Amz-Signature=6de7d4f61531b474fafd0c9cbfc19eef06908795a8fff9451d369a8cb85ec04b&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

3. Scroll down to the quick upload section

![Porkbun Zone File Import](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/139296cc33927d5d3c4e6e493ed61545914dec905b620a0d6a5408f3010f8e95/assets/porkbun-import.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164449Z&X-Amz-Expires=604800&X-Amz-Signature=caef8fd0579e294a39d9a62dd83e3cb98165f7e533f38d093ff986d75ba4dd30&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

4. Upload the downloaded BIND zone file as is

#### Important: Review Before Importing

Uploading a BIND zone file in Porkbun REPLACES the existing records you have.
This is fine if this is a fresh domain you bought for the sake of sending
email but if this is a domain that has other important records configured,
consider adding [additional records manually](#option-b-add-individual-records).

#### BIND Zone File Format

Check that all records (TXT, MX) have been correctly imported in the
console(the console will show in real time if we can find the records,
typically within seconds).

### Option B: Add Individual Records

Below are detailed instructions for AWS Route53, CloudFlare, and Namecheap. The instructions vary depending on whether you're using the AgentMail Console or the API directly.

#### DKIM record type

Legacy orgs should keep existing working DNS records in place. For new domain setup, add the TXT selector records returned by the AgentMail Console or API.

#### Via Console

If you created your domain through the [AgentMail Console](https://console.agentmail.to), the DNS records are displayed in a simplified format that's ready for copy-paste into your DNS provider.

#### Cloudflare

In the dashboard (**DNS > Records**), click **"Add record"**.

* **TXT (DMARC/SPF/DKIM):**
  * **Name:** Copy the **Name** value directly from the console.
  * **Content:** Copy the **Value** from the console.

* **MX:**
  * **Name:** Enter `@` to apply the record to the root domain.
  * **Mail server:** Copy the **Value** from the console.
  * **Priority:** Use the priority shown in the console.

#### AWS Route 53

In your hosted zone, click **"Create record"**.

* **TXT (DMARC/SPF/DKIM):**
  * **Record name:** Copy the **Name** value directly from the console (e.g., `_dmarc` or `mail` or `selector._domainkey`).
  * **Value:** Copy the **Value** from the console, ensuring it is enclosed in quotes.

#### CRITICAL: Route 53 TXT Record 255 Character Limit

**AWS Route 53 has a 255 character maximum per string.** It will get angry at the DKIM record since it is longer than 255 chars (we use more secure encryption key so we get better deliverability with Gmail!)

**When entering TXT values in the Route 53 UI, you MUST do the following.**

1. Split the value into two quoted strings.
   a. e.g.: "abcd" -> "ab""cd"
2. Ensure there is NO SPACE between the quoted strings. This will make or break validation.

**Correct:** `"first-part-of-value""second-part-of-value"`

**Wrong:** `"first-part-of-value" "second-part-of-value"` (space between strings)

If you accidentally include a space or click enter, Route 53 will create **two separate TXT records** instead of one concatenated record. This will cause email authentication to fail, and providers like **Gmail will reject your emails**.

* **MX:**
  * **Record name:** Enter the value exactly as we return it, whether its `@` or the subdomain.
  * **Value:** Copy the **Value** from the console (e.g., `inbound-smtp.us-east-1.amazonaws.com`).
  * **Priority:** Use the priority shown in the console (typically `10`).

#### Console Advantage

The console automatically formats DNS record names to be relative hostnames (without the full domain), making them ready for direct copy-paste into your DNS provider. No manual parsing required!

#### Via API

If you're using the API directly, the DNS records are returned as fully qualified domain names (FQDNs) that require some manual parsing.

#### Cloudflare

In the dashboard (**DNS > Records**), click **"Add record"**.

* **TXT (DMARC/SPF/DKIM):**
  * **Name:** Enter the part of the `name` before your root domain (e.g. `_dmarc`).
  * **Content:** Copy paste the `value` from the API response.

* **MX:**
  * **Name:** Enter the part of the name before your root domain
  * **Mail server:** Enter the `value` from the API.
  * **Priority:** Enter the `priority` from the API.

#### AWS Route 53

In your hosted zone, click **"Create record"**.

* **TXT (DMARC/SPF/DKIM):**
  * **Record name:** Enter the part of the `name` before your root domain (e.g., `_dmarc` for a `name` of `_dmarc.domain.com`, or `mail` for a `name` of `mail.domain.com`, or `selector._domainkey` for a `name` of `selector._domainkey.agents.com`).
  * **Value:** Copy paste the `value` from the API, ensuring it is enclosed in quotes.

#### CRITICAL: Route 53 TXT Record 255 Character Limit

**AWS Route 53 has a 255 character maximum per string.** It will get angry at the DKIM record since it is longer than 255 chars (we use more secure encryption key so we get better deliverability with Gmail!)

**When entering TXT values in the Route 53 UI, you MUST do the following.**

1. Split the value into two quoted strings.
   a. e.g.: "abcd" -> "ab""cd"
2. Ensure there is NO SPACE between the quoted strings. This will make or break validation.

**Correct:** `"first-part-of-value""second-part-of-value"`

**Wrong:** `"first-part-of-value" "second-part-of-value"` (space between strings)

If you accidentally include a space or click enter, Route 53 will create **two separate TXT records** instead of one concatenated record. This will cause email authentication to fail, and providers like **Gmail will reject your emails**.

* **MX:**
  * **Record name:** Leave this field blank to apply the record to the root domain.
  * **Value:** This is critical. You must combine the `priority` and `value` from the API into a single string, separated by a space. For example: `10 inbound-smtp.us-east-1.amazonaws.com`.

#### 3. Verify Your Domain

Once you've added the records, AgentMail automatically begins to check them. This can take anywhere from a few minutes to 48 hours for your DNS changes to propagate across the internet.

Check your domain verification status in the [AgentMail Console](https://console.agentmail.to/dashboard/domains):

1. **Navigate to Domains**: Go to the "Domains" section in the left sidebar
2. **View Domain Status**: Find your domain in the list and check its status
3. **Monitor Progress**: The status will update automatically as verification progresses
4. **View Details**: Click on your domain to see detailed information about which records are verified

The status indicators will show you exactly where you are in the process:

* **`Not Started`**: You need to click the Verify Domain button to kick start the process
* **`Pending`**: You still need to add or fix your DNS records
* **`Invalid`**: Some of your records are misconfigured. Please verify you inputted them correctly.
* **`Failed`**: Your records are correct, but our servers need a bump. Please click the verify domain button in the console.
* **`Verifying`**: DNS records are correct, and we're authorizing the domain
* **`Verified`**: Domain is fully verified and ready for sending

Here are instructions for some common DNS providers. This list is not exhaustive, so please consult your provider's documentation if you don't see it here.

| DNS/Hosting Provider | Documentation Link                                                                                                                                                                                                                                                                                                                                                                 |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GoDaddy**          | [MX: Add an MX record](https://www.godaddy.com/help/add-an-mx-record-19234)  [TXT: Add a TXT record](https://www.godaddy.com/help/add-a-txt-record-19232)                                                                                                                                                                                                                          |
| **DreamHost**        | [How do I add custom DNS records?](https://help.dreamhost.com/hc/en-us/articles/215414867-How-do-I-add-custom-DNS-records)                                                                                                                                                                                                                                                         |
| **Cloudflare**       | [MX: How do I add or edit mail or MX records?](https://support.cloudflare.com/hc/en-us/articles/200168806-Managing-DNS-records-in-Cloudflare)  [TXT: Managing DNS records in Cloudflare](https://support.cloudflare.com/hc/en-us/articles/200168806-Managing-DNS-records-in-Cloudflare)                                                                                            |
| **HostGator**        | [Manage DNS Records with HostGator/eNom](https://www.hostgator.com/help/article/manage-dns-records-with-hostgator-enom)                                                                                                                                                                                                                                                            |
| **Namecheap**        | [MX: How can I set up MX records required for mail service?](https://www.namecheap.com/support/knowledgebase/article.aspx/434/2237/how-can-i-set-up-mx-records-required-for-mail-service)  [TXT: How do I add TXT/SPF/DKIM/DMARC records for my domain?](https://www.namecheap.com/support/knowledgebase/article.aspx/317/2237/how-do-i-add-txtspfdkimdmarc-records-for-my-domain) |
| **Names.co.uk**      | [Changing your domain's DNS settings](https://www.names.co.uk/support/articles/changing-your-domains-dns-settings/)                                                                                                                                                                                                                                                                |
| **Wix**              | [MX: Adding or Updating MX Records in Your Wix Account](https://support.wix.com/en/article/adding-or-updating-mx-records-in-your-wix-account)  [TXT: Adding or Updating TXT Records in Your Wix Account](https://support.wix.com/en/article/adding-or-updating-txt-records-in-your-wix-account)                                                                                    |

#### Ready to Go!

Once your domain status is `ready`, you can start creating `Inboxes` with your
custom domain and building your agents!

## Setting Up Subdomains

By default, a verified domain only hosts inboxes on the exact domain you registered (e.g. `agent@example.com`). To create inboxes on **arbitrary subdomains** (e.g. `agent@bot.example.com`, `support@sales.example.com`) without registering each subdomain as its own domain, enable **subdomains** on the parent domain.

To set this up, add one new **required** record to your top-level domain: a wildcard MX (`*.example.com`). Once it's published and verified, you can create inboxes on any subdomain of the domain.

#### 1. Enable subdomains on the domain

Set `subdomains_enabled` when you create the domain, or turn it on later with an update.

```python title="Python"
from agentmail import AgentMail

client = AgentMail(api_key="YOUR_API_KEY")

# Enable at creation
domain = client.domains.create(domain="example.com", subdomains_enabled=True)

# Or enable on an existing domain
domain = client.domains.update("example.com", subdomains_enabled=True)

print("DNS records:", domain.records)
```

```typescript title="TypeScript"
import { AgentMailClient } from "agentmail";

const client = new AgentMailClient({ apiKey: "YOUR_API_KEY" });

// Enable at creation
let domain = await client.domains.create({ domain: "example.com", subdomainsEnabled: true });

// Or enable on an existing domain
domain = await client.domains.update("example.com", { subdomainsEnabled: true });

console.log("DNS records:", domain.records);
```

```bash title="cURL"
# Enable on an existing domain
curl -X PATCH https://api.agentmail.to/v0/domains/example.com \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"subdomains_enabled": true}'
```

#### Verified domains return to Pending

Enabling subdomains on an already-verified domain adds the wildcard MX as a new required record, so the domain returns to `Pending` until that record is published and verified. Sending is not interrupted while this happens.

#### 2. Publish the wildcard MX record

The response `records` array (and the BIND zone file) now includes a wildcard MX. Add it to your DNS provider exactly like the other MX record, using `*` as the host:

| Field       | Value                                  |
| :---------- | :------------------------------------- |
| Type        | `MX`                                   |
| Name / Host | `*` (resolves to `*.example.com`)      |
| Value       | `inbound-smtp.us-east-1.amazonaws.com` |
| Priority    | `10`                                   |

#### If your domain is itself a subdomain

If the domain you registered is itself a subdomain (e.g. `mail.example.com`), the wildcard is `*.mail.example.com`, so enter `*.mail` as the host. The console and zone file always show the exact name to use.

#### 3. Create inboxes on any subdomain

Once the domain is `Verified`, create an inbox on any subdomain by passing it as the `domain`:

```python title="Python"
inbox = client.inboxes.create(username="agent", domain="bot.example.com")
print(inbox.inbox_id)  # agent@bot.example.com
```

```typescript title="TypeScript"
const inbox = await client.inboxes.create({ username: "agent", domain: "bot.example.com" });
console.log(inbox.inboxId); // agent@bot.example.com
```

You don't need to register `bot.example.com` separately: AgentMail routes it through the parent domain's wildcard MX. Creating a subdomain inbox on a domain that does **not** have subdomains enabled returns a `422` error.

Subdomain inboxes don't appear under `GET /domains` (only registered domains do); list your inboxes to see them.

Inboxes on a subdomain send under the parent domain's identity and DKIM, so they share its sending reputation rather than building their own. To give a subdomain an isolated reputation, register it as a separate domain instead, see [Isolate reputations with subdomains](/managing-domains#strategy-1-isolate-reputations-with-subdomains).

## Troubleshooting Common DNS Issues

DNS can be tricky. Here are some common issues and how to resolve them.

#### My DNS changes aren't showing up instantly

DNS propagation can take up to 48 hours, though it's often much faster. If
it's been a while, click the verify domain button in the console which will trigger a reverification manually(DNS propagation can get stuck at times).

#### I'm seeing 'Too many SPF records' errors

A domain must have only **one** SPF record. If you're using other services that send email on your behalf (like a CRM), you need to merge their SPF policies with AgentMail's into a single record.

An SPF record is a single line of text. It starts with `v=spf1` and ends with a mechanism like `~all` or `-all`. All your permitted senders go in the middle.

**How to Merge:**

1. **Find your existing SPF record.** It will look something like this: `v=spf1 include:_spf.other-domain.com ~all`
2. **Find AgentMail's SPF include.** This is `include:spf.agentmail.to`.
3. **Combine them.** Copy the `include` from AgentMail and place it into your existing record, right before the `~all` or `-all` part.

```text title="Example: Merging SPF records"
# Before
v=spf1 include:_spf.other-domain.com ~all

# After
v=spf1 include:_spf.other-domain.com include:spf.agentmail.to ~all
```

Just keep adding `include:` mechanisms for each service you use. Remember to only have one `v=spf1` at the beginning and one `~all` or `-all` at the end.

## Best Practices for Domain Management

Check out our guide on [Email Deliverability](/email-deliverability) for tips on warming up your new domain and maintaining a healthy sender reputation.