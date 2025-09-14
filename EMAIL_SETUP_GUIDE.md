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

### 1.3 Update .env File
Update your `.env` file with the following values:

```bash
# Email Configuration (SMTP) - Gmail Setup
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="rfid.attendance.system.cainta@gmail.com"
SMTP_PASS="lrbj ujfg xumt hugu"
SMTP_FROM="noreply@icct.edu.ph"
```

**Important Notes:**
- Replace `your-actual-gmail@gmail.com` with your real Gmail address
- Replace `your-16-character-app-password` with the app password from Step 1.2
- Use the app password, NOT your regular Gmail password

## Step 2: Test Configuration

After updating the .env file, restart your development server:

```bash
npm run dev
```

The email service will now be able to send real emails through Gmail SMTP.

## Troubleshooting

### Common Issues:
1. **"Invalid login"** - Make sure you're using the app password, not your regular password
2. **"Less secure app access"** - Enable 2-Factor Authentication and use app passwords
3. **"Connection timeout"** - Check your internet connection and firewall settings

### Alternative SMTP Providers:
If Gmail doesn't work, you can use:
- **SendGrid**: More reliable for production
- **AWS SES**: Good for high volume
- **Outlook/Hotmail**: Similar setup to Gmail
