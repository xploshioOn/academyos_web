# AcademyOS Web Proxy

Small AWS Lambda + API Gateway that proxies the Webflow page at https://creativeloop.tech/products so hitting `academyos.app` returns that content transparently.

## How it works
- `src/handler.mjs` fetches the Webflow page and returns the HTML with simple caching.
- `template.yaml` defines a Node.js 20 Lambda behind an HTTP API (`$default` stage) and now also provisions the custom domain, API mapping, and Route53 records.
- GitHub Actions builds/deploys the SAM stack on every push to `main`.

## Prerequisites
- AWS account with permissions for Lambda, API Gateway (HTTP API), CloudFormation, S3 (for SAM artifacts), and ACM for the certificate.
- GitHub repo secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` (defaults to `us-east-1` in `samconfig.toml`, change if desired)
  - `CERTIFICATE_ARN` (ACM cert covering the domain)
  - `HOSTED_ZONE_ID` (Route53 hosted zone for the domain)
  - `DOMAIN_NAME` (optional, defaults to `academyos.app`)
  - `CREATE_WWW_RECORD` (optional, `true`/`false`; defaults to `true`)

## CI/CD
- Workflow: `.github/workflows/deploy.yml`
- On push to `main`: installs SAM CLI, runs `sam build`, and `sam deploy --resolve-s3` with the domain parameters pulled from secrets.
- Stack name: `academyos-web` (see `samconfig.toml`).

## Local deploy (first-time optional)
```
sam build
sam deploy --guided   # or rely on samconfig.toml defaults
```
Copy the `ApiBaseUrl` output for testing before wiring the domain.

## Connecting the domain (Route53)
1. **Request certificate** (ACM, same region as deploy): request a public cert for `academyos.app` and `www.academyos.app`; validate using the CNAME records ACM provides. Save the cert ARN for deployment.
2. **Set DNS to Route53**: point the domain’s nameservers to the Route53 hosted zone you created for `academyos.app`.
3. **Deploy with domain params**:
   - `DomainName`: apex domain (defaults to `academyos.app`).
   - `CertificateArn`: ACM cert ARN from step 1.
   - `HostedZoneId`: hosted zone ID for the domain.
   - `CreateWwwRecord`: `true` (default) to add `www` → apex CNAME, `false` to skip.
4. After deploy, CloudFormation creates the API Gateway custom domain, maps it to the `$default` stage, and creates an Alias A-record to the API. The optional `www` CNAME is also created.
5. Wait for DNS + certificate propagation, then browse `https://academyos.app` (and `https://www.academyos.app` if enabled).

## Costs
Lambda + HTTP API are within the free tier for low traffic but still bill per request; ACM certificates are free.
