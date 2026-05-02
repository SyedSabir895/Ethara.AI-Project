# SMTP Configuration Guide for Production Deployment

## ⚠️ Critical: SMTP is Required for These Features
- Password reset emails
- Teacher account creation notifications  
- Any future email notifications

---

## Setup Instructions

### Option 1: Using Gmail (Recommended for Simplicity)

**Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Complete the verification process

**Step 2: Generate App Password**
1. Go to [Google App Passwords](https://myaccount.google.com/app-passwords)
2. Select "Mail" as the app
3. Select "Windows PC" (or your device type)
4. Google will generate a 16-character password
5. Copy this password (it will look like: `abcd efgh ijkl mnop`)

**Step 3: Configure Environment Variables**
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=abcdefghijklmnop  # Remove spaces from the 16-char password
MAIL_DEFAULT_SENDER=NRI-AIML <your-email@gmail.com>
```

---

### Option 2: Using Custom SMTP Server (AWS SES, Mailgun, SendGrid, etc.)

**AWS SES Example:**
```env
MAIL_SERVER=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your-aws-ses-username
MAIL_PASSWORD=your-aws-ses-password
MAIL_DEFAULT_SENDER=noreply@your-domain.com
```

**Mailgun Example:**
```env
MAIL_SERVER=smtp.mailgun.org
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=postmaster@your-domain.mailgun.org
MAIL_PASSWORD=your-mailgun-password
MAIL_DEFAULT_SENDER=noreply@your-domain.com
```

---

## Common Issues & Troubleshooting

### ❌ Issue: "SMTPAuthenticationError: (535, b'5.7.8 Username and password not accepted')"
**Solution:**
- If using Gmail, verify you're using an **App Password**, not your regular Gmail password
- Check that 2-Factor Authentication is enabled
- Ensure `MAIL_USERNAME` and `MAIL_PASSWORD` have no extra spaces

### ❌ Issue: "Connection refused" or "SMTP connection timeout"
**Solution:**
- Verify `MAIL_SERVER` and `MAIL_PORT` are correct for your provider
- Check firewall rules allow outbound SMTP (port 587 or 465)
- For Gmail: Use port 587 with TLS, not port 465

### ❌ Issue: Email variables missing in production
**Solution:**
- Ensure all environment variables are set in your production hosting platform
- For Railway/Heroku/etc., add them in the environment variables section
- Verify no typos in variable names (`MAIL_USERNAME`, `MAIL_PASSWORD`, etc.)

### ❌ Issue: Emails are sent but not received
**Solution:**
- Check spam/junk folder
- Verify `MAIL_DEFAULT_SENDER` matches your SMTP account email
- Some providers may require you to verify the sender email first

---

## Testing SMTP Configuration

Run the test script to verify your configuration:
```bash
cd backend
python scripts/test_smtp.py
```

This will test the connection to your SMTP server.

---

## Deployment Checklist

- [ ] Create `.env` file with all `MAIL_*` variables
- [ ] Test SMTP connection locally first
- [ ] Set environment variables on production platform
- [ ] Verify emails can be sent after deployment
- [ ] Monitor logs for email sending errors
- [ ] Set up alerts for email delivery failures (if needed)

---

## Environment Variables Summary

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `MAIL_SERVER` | SMTP server address | Yes | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port (587 for TLS, 465 for SSL) | Yes | `587` |
| `MAIL_USE_TLS` | Enable TLS encryption | Yes | `true` |
| `MAIL_USE_SSL` | Enable SSL encryption | No | `false` |
| `MAIL_USERNAME` | SMTP account username/email | Yes | `your-email@gmail.com` |
| `MAIL_PASSWORD` | SMTP account password or app password | Yes | `abcdefghijklmnop` |
| `MAIL_DEFAULT_SENDER` | Email address emails will be "from" | Yes | `NRI-AIML <your-email@gmail.com>` |
| `MAIL_SUPPRESS_SEND` | Disable actual email sending (for testing) | No | `false` |

---

## Security Notes

⚠️ **DO NOT commit `.env` file to git** - it contains sensitive credentials

✓ **DO** add `.env` to `.gitignore`

✓ **Store credentials** in production platform's environment variable manager, not in code

✓ **Use App Passwords** instead of regular passwords (Gmail requirement for security)

✓ **Rotate credentials** periodically in production environments
