# Email Service Setup Guide (Gmail SMTP)

## Step 1: Configure Gmail SMTP Credentials

### 1.1 Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Factor Authentication if not already enabled

### 1.2 Generate App Password
1. Go to Google Account → Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Select "Mail" and your device
4. Copy the generated 16-character password

### 1.3 Update .env File (do not commit)
Create or update your local `.env` file with placeholders (never commit real credentials):

```bash
# Email Configuration (SMTP) - Gmail Setup
# ⚠️  WARNING: These are PLACEHOLDER values - replace with real credentials in .env only
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="PLACEHOLDER_GMAIL_ADDRESS"          # Replace with your actual Gmail
SMTP_PASS="PLACEHOLDER_APP_PASSWORD"           # Replace with your actual app password
SMTP_FROM="noreply@icct.edu.ph"
```

Important Notes:
- Do NOT commit real credentials. Keep them only in `.env` locally and in your secret manager in prod.
- Replace `<your-gmail>@gmail.com` with your Gmail address.
- Replace `<your-16-char-app-password>` with the app password from Step 1.2 (not your normal password).

## Step 2: Test Configuration

After updating the .env file, restart your development server:

```bash
npm run dev
```

The email service will now be able to send real emails through Gmail SMTP.

## Troubleshooting

### Common Issues:
1. "Invalid login" - Make sure you're using the app password, not your regular password
2. "Less secure app access" - Enable 2-Factor Authentication and use app passwords
3. "Connection timeout" - Check your internet connection and firewall settings

### Alternative SMTP Providers:
If Gmail doesn't work, you can use:
- SendGrid: More reliable for production
- AWS SES: Good for high volume
- Outlook/Hotmail: Similar setup to Gmail


