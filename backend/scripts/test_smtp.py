"""
Quick SMTP test script. Run from the backend folder after configuring .env.
Usage: python scripts/test_smtp.py
"""
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('MAIL_PORT', 587))
USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
USERNAME = os.getenv('MAIL_USERNAME')
PASSWORD = os.getenv('MAIL_PASSWORD')
TO = os.getenv('MAIL_USERNAME')

msg = EmailMessage()
msg['Subject'] = 'SMTP Test'
msg['From'] = USERNAME
msg['To'] = TO
msg.set_content('This is a test email from College Task Manager SMTP tester.')

print(f"Testing SMTP server {SMTP_SERVER}:{SMTP_PORT} as {USERNAME}")
try:
    if USE_TLS:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
    else:
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)

    server.login(USERNAME, PASSWORD)
    server.send_message(msg)
    server.quit()
    print('Test email sent successfully')
except Exception as e:
    print('Failed to send test email:', e)