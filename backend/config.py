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
    
    # Mail settings
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv(
        'MAIL_DEFAULT_SENDER',
        f"NRI-AIML <{MAIL_USERNAME}>" if MAIL_USERNAME else 'NRI-AIML'
    )
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').replace('localhost:5174', 'localhost:5173')
