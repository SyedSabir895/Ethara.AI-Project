from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from flask_bcrypt import Bcrypt
from models import User, db
from bson import ObjectId
from datetime import datetime, timedelta
import secrets
import threading
from config import Config

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()


# ========================= EMAIL FUNCTION =========================
def send_password_reset_email(user_email, user_name, reset_link):
    from app import mail
    from flask_mail import Message

    msg = Message(
        subject="Password reset for College Task Manager",
        recipients=[user_email],
        body=(
            f"Hi {user_name},\n\n"
            "We received a request to reset your password. Click the link below to set a new password (valid for 1 hour):\n\n"
            f"{reset_link}\n\n"
            "If you did not request this, you can ignore this message.\n\n"
            "Regards,\nCollege Task Manager Team"
        )
    )

    # Capture real app instance BEFORE thread starts
    app = current_app._get_current_object()

    def _send(msg, app):
        with app.app_context():
            try:
                mail.send(msg)
                app.logger.info(f"✓ Reset email sent successfully to {user_email}")
            except Exception as e:
                app.logger.error(f"❌ Failed to send reset email to {user_email}: {e}")

    thread = threading.Thread(target=_send, args=(msg, app))
    thread.start()


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        print("DEBUG: Received register request")
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'Teacher')

        if not name or not email or not password:
            return jsonify({"message": "All fields are required"}), 400

        print(f"DEBUG: Checking if user exists: {email}")
        if User.find_by_email(email):
            return jsonify({"message": "User with this email already exists"}), 409

        print("DEBUG: Hashing password")
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        new_user = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "role": role,
            "createdAt": datetime.utcnow()
        }
        
        print("DEBUG: Inserting into DB")
        db.users.insert_one(new_user)
        print("DEBUG: Registration successful")
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        print(f"ERROR in /register: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"message": "Internal Server Error", "error": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.find_by_email(email)
    
    if user and bcrypt.check_password_hash(user['password'], password):
        # Remove password from user object
        user_data = {
            "token": create_access_token(identity=str(user['_id'])),
            "role": user['role'],
            "name": user['name'],
            "email": user['email'],
            "_id": str(user['_id'])
        }
        return jsonify(user_data), 200
    
    return jsonify({"message": "Invalid email or password"}), 401


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({"message": "Please provide an email"}), 400

    user = User.find_by_email(email)
    if not user:
        return jsonify({"message": "No account found for that email address"}), 404

    # generate token and expiry
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=1)

    db.users.update_one({"_id": user['_id']}, {"$set": {"reset_token": token, "reset_token_expires": expires_at}})

    reset_link = f"{Config.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
    send_password_reset_email(email, user.get('name', ''), reset_link)

    return jsonify({"message": "Reset link sent successfully"}), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('password')

    if not token or not new_password:
        return jsonify({"message": "Token and new password are required"}), 400

    user = db.users.find_one({"reset_token": token})
    if not user:
        return jsonify({"message": "Invalid or expired token"}), 400

    expires = user.get('reset_token_expires')
    if not expires or expires < datetime.utcnow():
        return jsonify({"message": "Invalid or expired token"}), 400

    hashed = bcrypt.generate_password_hash(new_password).decode('utf-8')
    db.users.update_one({"_id": user['_id']}, {"$set": {"password": hashed}, "$unset": {"reset_token": "", "reset_token_expires": ""}})

    return jsonify({"message": "Password updated successfully"}), 200
