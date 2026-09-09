> For clean Markdown content of this page, append .md to this URL. For the complete documentation index, see https://docs.agentmail.to/llms.txt. For full content including API reference and SDK examples, see https://docs.agentmail.to/llms-full.txt.

# Email Deliverability

> Learn the strategies and best practices for maximizing your email deliverability with AgentMail.

## What is Email Deliverability?

Email deliverability is the art and science of getting your emails into your recipients' inboxes. It's not just about hitting "send"; it's about building a good reputation with email providers like Gmail and Outlook so they trust that you're sending valuable content, not spam.

High deliverability is the key to successful email automation. This guide will walk you through the best practices for both your sending strategy and your email content.

### The Technical Foundation: SPF, DKIM, DMARC

Before you send your first email, it's important to have the right technical foundation in place. SPF, DKIM, and DMARC are DNS records that act as a digital signature, proving to email providers that you are who you say you are.

We take care of all of this for you guys, so no need to worry about these.
Just something to know about(or google).

For maximum control and the best deliverability, we strongly recommend using your own custom domains. Setting these records up correctly on your own domain is the single most important step you can take.

#### [Guide: Managing Custom Domains](/custom-domains)

Learn how to add your own domain and configure SPF, DKIM, and DMARC records.

## High-Volume Sending Strategy

How you send your emails is just as important as what you send. If you're sending a large volume of emails, follow these steps to build and maintain a strong sender reputation.

#### Warm-Up Your Inboxes

Don't go from zero to one thousand emails overnight. Email providers get
suspicious of new inboxes that immediately send a high volume. Start slow
and gradually increase your sending volume over several days or weeks. This
"warm-up" process signals that you're a legitimate sender.

**Example Warm-Up Schedule:**
\
&#x20;\- Day 1: 10 emails/inbox
\
&#x20;\- Day 2: 20 emails/inbox
\
&#x20;\- Day 3: 40 emails/inbox
\
&#x20;\- ...and so on.

#### Diversify Your Sending Inboxes

Instead of sending 10,000 emails from a single inbox, it's far better to
send 100 emails from 100 different inboxes. This distributes your sending
volume, reduces the risk of any single inbox getting flagged, and looks much
more natural to email providers. AgentMail's ability to create inboxes at
scale makes this strategy easy to implement.

![Diagram comparing one inbox sending 1000 emails vs. five inboxes sending 200 each.](https://fdr-prod-docs-files-public.s3.us-east-1.amazonaws.com/agentmail-production.docs.buildwithfern.com/718d953f857886e2d6c6e554184b6800f3c62fcbd340c506764c5d0669151940/assets/inbox-diversification.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA6KXJSKKNFOCF7G4B%2F20260908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20260908T164524Z&X-Amz-Expires=604800&X-Amz-Signature=186bae77512b8845dfd4784a476c1e026ea12273ea3ba34421a698b5fd0d45c7&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

#### Protect Your Reputation with Multiple Domains

An email domain's reputation is its most valuable asset. To protect it, use
multiple custom domains for your outreach campaigns. If one domain's
reputation is inadvertently damaged, you can cycle it out without impacting
the deliverability of your other domains.

## High-Impact Content Strategy

The content of your email plays a huge role in whether it's seen as a valuable message or as spam.

#### Personalize Everything

Address your recipients by name in the subject line and email body. Use
other data points you have to make the email feel like a one-to-one
conversation, not a mass blast. Generic emails are a major red flag for spam
filters.

#### Write Like a Human, Not a Marketer

Avoid "spammy" keywords (e.g., "free," "buy now," "limited time offer"),
excessive exclamation points, and using all caps. Write in a natural,
conversational tone. The goal is to start a conversation, not to close a
sale in the first email.

#### Be Strategic with images

Any type of image that isn't an attachment but included in the message body
actually sets off the spam alarms. Don't do it. Also get rid of your
open-tracker while you're at it because how EVERY service checks if the
recipient of your email opened your message is by encoding a small image
into the body. Hurts deliverability!!

#### CTA Selection

Email providers are wary of emails links, especially in the first message of
a conversation. A great strategy is to send your initial outreach with no
links or images. Wait for the recipient to reply, and *then* send your
call-to-action (CTA) link. This behavior is viewed far more favorably, as
it's now viewd as a "conversation."

#### HTML + Text

Email providers oftentimes flag emails that only include HTML as spam.
Providing a plain text alternative demonstrates the legitimacy of your
message to providers like Gmail and increases the chances of it reaching the
recipient's inbox.