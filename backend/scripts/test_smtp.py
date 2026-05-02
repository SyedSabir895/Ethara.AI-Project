"""
Quick SMTP test script. Run from the backend folder after configuring .env.
Usage: python scripts/test_smtp.py

This script tests whether your SMTP configuration is working correctly.
"""
import os
import sys
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('MAIL_PORT', 587))
USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
USE_SSL = os.getenv('MAIL_USE_SSL', 'false').lower() == 'true'
USERNAME = os.getenv('MAIL_USERNAME')
PASSWORD = os.getenv('MAIL_PASSWORD')
TO = os.getenv('MAIL_USERNAME')

print("=" * 60)
print("SMTP Configuration Test")
print("=" * 60)

# Validate configuration
if not USERNAME:
    print("❌ ERROR: MAIL_USERNAME not set in .env")
    sys.exit(1)
    
if not PASSWORD:
    print("❌ ERROR: MAIL_PASSWORD not set in .env")
    sys.exit(1)

print(f"SMTP Server:  {SMTP_SERVER}")
print(f"SMTP Port:    {SMTP_PORT}")
print(f"Use TLS:      {USE_TLS}")
print(f"Use SSL:      {USE_SSL}")
print(f"Username:     {USERNAME}")
print(f"Password:     {'*' * len(PASSWORD)}")  # Don't print actual password
print()

msg = EmailMessage()
msg['Subject'] = '[Test] SMTP Configuration Working'
msg['From'] = USERNAME
msg['To'] = TO
msg.set_content(
    'This is a test email from College Task Manager SMTP tester.\n\n'
    'If you are reading this, your SMTP configuration is working correctly!'
)

print("Attempting to connect and send test email...")
try:
    if USE_SSL:
        print(f"  → Connecting to {SMTP_SERVER}:{SMTP_PORT} with SSL...")
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=10)
    else:
        print(f"  → Connecting to {SMTP_SERVER}:{SMTP_PORT}...")
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=10)
        if USE_TLS:
            print(f"  → Starting TLS encryption...")
            server.starttls()
    
    print(f"  → Authenticating as {USERNAME}...")
    server.login(USERNAME, PASSWORD)
    
    print(f"  → Sending test email to {TO}...")
    server.send_message(msg)
    
    server.quit()
    
    print()
    print("=" * 60)
    print("✅ SUCCESS: SMTP configuration is working correctly!")
    print("=" * 60)
    print()
    print("Your email features should work in production:")
    print("  • Password reset emails")
    print("  • Teacher account creation notifications")
    print("  • Other email features")
    
except smtplib.SMTPAuthenticationError as e:
    print()
    print("=" * 60)
    print("❌ AUTHENTICATION ERROR")
    print("=" * 60)
    print()
    print("Your username or password is incorrect.")
    print()
    if 'gmail' in SMTP_SERVER.lower():
        print("If using Gmail:")
        print("  1. Verify 2-Factor Authentication is enabled")
        print("  2. Generate an App Password (not your regular Gmail password)")
        print("  3. Go to: https://myaccount.google.com/app-passwords")
        print("  4. Use the 16-character app password (remove spaces)")
    print()
    print(f"Error details: {e}")
    sys.exit(1)
    
except smtplib.SMTPException as e:
    print()
    print("=" * 60)
    print("❌ SMTP ERROR")
    print("=" * 60)
    print()
    print(f"Error: {e}")
    print()
    print("Troubleshooting:")
    print(f"  1. Verify MAIL_SERVER ({SMTP_SERVER}) is correct")
    print(f"  2. Verify MAIL_PORT ({SMTP_PORT}) is correct")
    print(f"  3. Check firewall allows outbound SMTP")
    print(f"  4. Verify TLS/SSL settings (USE_TLS={USE_TLS}, USE_SSL={USE_SSL})")
    sys.exit(1)
    
except Exception as e:
    print()
    print("=" * 60)
    print("❌ UNEXPECTED ERROR")
    print("=" * 60)
    print()
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {e}")
    print()
    print("Please check:")
    print("  • All environment variables are set correctly")
    print("  • Internet connection is available")
    print("  • Firewall allows SMTP connections")
    sys.exit(1)