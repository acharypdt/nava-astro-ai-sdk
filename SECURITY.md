# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, email us directly at: **navasanganakah@gmail.com**

We will respond within 48 hours and work with you to address the issue.

## Security Practices

- All API keys and secrets are stored as environment variables
- User birth data is encrypted at rest (AES-256-GCM)
- JWT tokens expire after 24 hours
- Rate limiting is enforced on all API endpoints
- CORS is restricted to authorized domains only
