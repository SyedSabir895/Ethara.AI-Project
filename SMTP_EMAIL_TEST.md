# Email Configuration Testing Guide

## Quick Check: Is Email Working?

When you add a teacher from the HOD dashboard, you'll now see:
- ✓ **Email sent successfully** → Credentials email was sent to the teacher
- ⚠️ **Email failed** → There's an issue with SMTP configuration

## Test SMTP Configuration

Run this command from the backend folder to validate your email setup:

```bash
python scripts/test_smtp.py
```

This script will:
1. Check if `MAIL_USERNAME` and `MAIL_PASSWORD` are set
2. Connect to the SMTP server
3. Send a test email to your configured email address
4. Show detailed error messages if anything fails

## Expected Output

### ✅ Success
```
============================================================
✅ SUCCESS: SMTP configuration is working correctly!
============================================================

Your email features should work in production:
  • Password reset emails
  • Teacher account creation notifications
  • Other email features
```

### ❌ Authentication Error
If you see this, your username or password is incorrect.

**For Gmail users:**
1. Enable 2-Factor Authentication
2. Generate an App Password: https://myaccount.google.com/app-passwords
3. Use the 16-character app password (remove spaces) in `MAIL_PASSWORD`
4. Keep `MAIL_PORT=587` and `MAIL_USE_TLS=true`

### ❌ SMTP Connection Error
If you see this, check:
1. `MAIL_SERVER` is correct (e.g., `smtp.gmail.com`)
2. `MAIL_PORT` is correct (usually 587 for TLS)
3. Firewall allows outbound SMTP connections
4. `MAIL_USE_TLS` and `MAIL_USE_SSL` settings are correct

## What Emails Are Sent?

### 1. **Teacher Account Creation**
When HOD adds a teacher via the dashboard:
- **To:** Teacher's email
- **Subject:** "Your Teacher Account - College Task Manager"
- **Body:** Includes email and temporary password

### 2. **Task Assignment**
When HOD assigns a task to a teacher:
- **To:** Assigned teacher's email
- **Subject:** "New Task Assigned: [Task Name]"
- **Body:** Task details, priority, due date, and remarks

### 3. **Password Reset**
When a teacher requests password reset:
- **To:** Teacher's email
- **Subject:** "Password reset for College Task Manager"
- **Body:** Includes secure reset link (valid for 1 hour)

## Environment Variables

Make sure these are set in your `.env` file:

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USE_SSL=false
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=College Task Manager <your-email@gmail.com>
MAIL_SUPPRESS_SEND=false
```

## Backend Logs

When adding a teacher, check the backend console for:

- `✓ Teacher credentials email sent successfully to [email]` → Email worked
- `❌ Failed to send email to [email]: [error]` → Check the error message

## Troubleshooting

### Emails not sending but test passes?
- Check that you're using the correct email in `recipients=[email]`
- Ensure the teacher's email is valid
- Some email providers may delay delivery (check spam folder)

### Test script fails but emails work?
- You may have allowed the app in your email security settings
- Run the test script again to confirm

### Getting "MAIL_USERNAME" error?
- Make sure `.env` file has `MAIL_USERNAME=your-email@gmail.com`
- Restart the Flask server after updating `.env`

## Support

If emails still aren't working after testing:
1. Check the backend console output when adding a teacher
2. Run `python scripts/test_smtp.py` to diagnose
3. Verify email and password in `.env`
4. Check your email provider's security settings
5. Try using a different email provider (e.g., SendGrid, AWS SES)
