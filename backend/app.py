import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from config import Config
from routes.auth_routes import auth_bp
from routes.task_routes import task_bp
from routes.user_routes import user_bp

app = Flask(__name__)
app.config.from_object(Config)

# Initialize Extensions
CORS(app, resources={r"/api/*": {"origins": "*"}})
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
