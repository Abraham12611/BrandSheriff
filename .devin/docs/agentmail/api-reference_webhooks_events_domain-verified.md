> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Domain Verified

POST 

Reference: https://docs.agentmail.to/api-reference/webhooks/events/domain-verified

## Request

### Headers

- `svix-id` (string, required) — ID of webhook message.
- `svix-signature` (string, required) — Signature of webhook message.
- `svix-timestamp` (datetime, required) — Timestamp of webhook message.

### Payload

- `type` ("event", required)
- `event_type` ("domain.verified", required)
- `event_id` (string, required) — ID of event.
- `domain` (object, required)
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