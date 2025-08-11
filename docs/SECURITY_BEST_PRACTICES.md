# Security Best Practices

## Database Credentials Security

### What to do if credentials are exposed:

1. **Immediately change all exposed credentials**
2. **Remove credentials from version control**
3. **Use environment variables**
4. **Update all applications using the old credentials**

### Current Setup

This project uses environment variables for database credentials. The `docker-compose.yml` file now uses:

```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER:-admin}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-admin123}
  POSTGRES_DB: ${POSTGRES_DB:-icct-sas}
```

### Setting up secure credentials:

1. **Run the setup script:**
   ```bash
   node scripts/setup-env.js
   ```

2. **This will create a `.env` file with:**
   - Secure random password
   - Generated JWT secrets
   - Proper DATABASE_URL format

3. **Update your application configuration** to use the new DATABASE_URL

### Security Checklist

- [ ] ✅ Docker Compose uses environment variables
- [ ] ✅ `.env` file is in `.gitignore`
- [ ] ✅ Credentials are not hardcoded in source code
- [ ] ✅ Database password is strong and unique
- [ ] ✅ JWT secrets are randomly generated
- [ ] ✅ Session secrets are randomly generated

### Environment Variables

Always use environment variables for:
- Database credentials
- API keys
- JWT secrets
- Session secrets
- SMTP credentials
- Any sensitive configuration

### Never commit to Git:
- `.env` files
- Hardcoded passwords
- API keys
- Private certificates
- Database dumps with real data

### Production Deployment

For production, use:
- Secret management services (AWS Secrets Manager, Azure Key Vault, etc.)
- Environment-specific `.env` files
- Docker secrets for containerized deployments
- Database connection pooling with proper authentication
