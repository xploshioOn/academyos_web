# AcademyOS Web Proxy

Small AWS Lambda + API Gateway that proxies the Webflow page at https://creativeloop.tech/products so hitting `academyos.app` returns that content transparently.

## How it works
- `src/handler.mjs` fetches the Webflow page and returns the HTML with simple caching.
- `template.yaml` defines a Node.js 20 Lambda behind an HTTP API (`$default` stage).
- GitHub Actions builds/deploys the SAM stack on every push to `main`.

## Prerequisites
- AWS account with permissions for Lambda, API Gateway (HTTP API), CloudFormation, S3 (for SAM artifacts), and ACM for the certificate.
- GitHub repo secrets:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION` (defaults to `us-east-1` in `samconfig.toml`, change if desired)

## CI/CD
- Workflow: `.github/workflows/deploy.yml`
- On push to `main`: installs SAM CLI, runs `sam build`, and `sam deploy --resolve-s3`.
- Stack name: `academyos-web` (see `samconfig.toml`).

## Local deploy (first-time optional)
```
sam build
sam deploy --guided   # or rely on samconfig.toml defaults
```
Copy the `ApiBaseUrl` output for testing before wiring the domain.

## Connecting the domain (GoDaddy)
1. **Request certificate** (ACM, same region as deploy): request public cert for `academyos.app` and `www.academyos.app`; validate via the CNAME records ACM provides (add them in GoDaddy DNS).
2. **Create API Gateway custom domain** (HTTP API → Custom domain names):
   - Domain: `www.academyos.app` (simpler with GoDaddy since CNAME is supported).
   - TLS cert: the ACM cert above.
   - Endpoint type: Regional.
3. **API mapping**: map the custom domain to your HTTP API and `$default` stage.
4. **DNS in GoDaddy**:
   - Add `CNAME` record: `www` → the API Gateway target domain shown after creating the custom domain (looks like `d-xxxx.execute-api.<region>.amazonaws.com`).
   - For the apex (`academyos.app`), GoDaddy doesn’t support ALIAS; either forward apex to `https://www.academyos.app` in GoDaddy, or move DNS to Route53 and use an ALIAS A-record to the API Gateway domain.
5. Wait for DNS + certificate propagation, then browse `https://www.academyos.app`.

## Costs
Lambda + HTTP API are within the free tier for low traffic but still bill per request; ACM certificates are free.
