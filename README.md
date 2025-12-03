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

## Connecting the domain (Route53)
Use a Route53 hosted zone and a public cert that already covers `academyos.app`/`www.academyos.app`. Wire DNS manually:
1. Apex A/ALIAS: point `academyos.app` to the API Gateway domain for the HTTP API (currently `d-x1um7jbv13.execute-api.us-east-1.amazonaws.com`).
2. `www` CNAME: point `www.academyos.app` to the API Gateway custom domain (currently `d-oysg6cs2z4.execute-api.us-east-1.amazonaws.com`).
3. Keep ACM validation CNAMEs in place. Wait for DNS propagation, then test `https://academyos.app` and `https://www.academyos.app`.

## Costs
Lambda + HTTP API are within the free tier for low traffic but still bill per request; ACM certificates are free.
