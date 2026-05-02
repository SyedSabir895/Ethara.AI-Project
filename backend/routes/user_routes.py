from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db
from flask_bcrypt import Bcrypt
from datetime import datetime
import secrets
import string
from flask_mail import Message

user_bp = Blueprint('users', __name__)
bcrypt = Bcrypt()


@user_bp.route('', methods=['GET', 'POST'], strict_slashes=False)
@jwt_required()
def manage_teachers():
    if request.method == 'POST':
        # Ensure only HODs can create teacher accounts
        requester_id = get_jwt_identity()
        requester = User.find_by_id(requester_id)
        if not requester or requester.get('role') != 'HOD':
            return jsonify({"message": "Only HODs can add teachers"}), 403


        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')  # optional: HOD can provide a password

        if not name or not email:
            return jsonify({"message": "Please provide name and email"}), 400

        if User.find_by_email(email):
            return jsonify({"message": "Email already exists"}), 409

        # Use provided password if present, otherwise generate a secure random password
        if not password:
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for _ in range(10))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

        new_teacher = {
            "name": name,
            "email": email,
            "password": hashed_password,
            "role": "Teacher",
            "createdAt": datetime.utcnow()
        }

        result = db.users.insert_one(new_teacher)

        # Send credentials via SMTP using configured Flask-Mail (include password)
        email_sent = False
        email_error = None
        try:
            from app import mail
            msg = Message(
                subject="Your Teacher Account - College Task Manager",
                recipients=[email],
                body=(
                    f"Hi {name},\n\n"
                    "An account has been created for you on College Task Manager.\n\n"
                    f"Email: {email}\n"
                    f"Password: {password}\n\n"
                    "Please login and change your password as soon as possible.\n\n"
                    "Regards,\nCollege Task Manager Team"
                )
            )
            mail.send(msg)
            email_sent = True
            print(f"✓ Teacher credentials email sent successfully to {email}")
        except Exception as e:
            email_error = str(e)
            print(f"❌ Failed to send email to {email}: {e}")
            import traceback
            traceback.print_exc()

        return jsonify({
            "message": "Teacher added successfully",
            "id": str(result.inserted_id),
            "emailSent": email_sent,
            "emailError": email_error if not email_sent else None
        }), 201

    # GET method
    teachers = User.get_all_teachers()
    for teacher in teachers:
        teacher['_id'] = str(teacher['_id'])
    return jsonify(teachers), 200
