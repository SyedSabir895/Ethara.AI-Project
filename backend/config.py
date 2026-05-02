import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv(
        'MONGO_URI',
        os.getenv('MONGODB_URI', 'mongodb://localhost:27017/college_task_manager')
    )
    JWT_SECRET_KEY = os.getenv(
        'JWT_SECRET_KEY',
        os.getenv('JWT_SECRET', 'secret-key')
    )
    ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv('ALLOWED_ORIGINS', '').split(',') if origin.strip()]
    # Mail settings
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true') == 'true'
    MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'false') == 'true'  # For port 465 (set to false for TLS on 587)
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv(
        'MAIL_DEFAULT_SENDER',
        f"NRI-AIML <{os.getenv('MAIL_USERNAME')}>" if os.getenv('MAIL_USERNAME') else 'NRI-AIML'
    )
    # Email logging timeout to prevent app from hanging
    MAIL_SUPPRESS_SEND = os.getenv('MAIL_SUPPRESS_SEND', 'false') == 'true'  # Set to true to disable sending (for testing)
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').replace('localhost:5174', 'localhost:5173')
    
    @classmethod
    def validate_mail_config(cls):
        """Validate that required mail configuration is present"""
        if not cls.MAIL_USERNAME:
            raise ValueError("MAIL_USERNAME environment variable is required")
        if not cls.MAIL_PASSWORD:
            raise ValueError("MAIL_PASSWORD environment variable is required")
        return True
