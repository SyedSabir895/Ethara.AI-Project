import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from datetime import timedelta
from config import Config
from routes.auth_routes import auth_bp
from routes.task_routes import task_bp
from routes.user_routes import user_bp

app = Flask(__name__)
app.config.from_object(Config)

# Set JWT token expiration time to 24 hours (default is 15 minutes)
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Validate mail configuration in production (but not when MAIL_SUPPRESS_SEND is true for testing)
if not app.config.get('MAIL_SUPPRESS_SEND', False):
    try:
        Config.validate_mail_config()
    except ValueError as e:
        # Only warn, don't fail, to allow app to start without mail for development
        print(f"⚠️  WARNING: {e} - Some email features will not work")

# Initialize Extensions
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "https://ethara-ai-clgproject.up.railway.app",
            "http://localhost:5173",
            "http://localhost:3000"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
}, supports_credentials=True)
jwt = JWTManager(app)
mail = Mail(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(task_bp, url_prefix='/api')
app.register_blueprint(user_bp, url_prefix='/api/users')

# Initialize Scheduler for task reminders
from scheduler import start_scheduler
scheduler = start_scheduler(app, mail)

@app.route('/')
def home():
    return jsonify({"message": "College Task Manager API is running"})

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
