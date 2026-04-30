from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from config import Config
from datetime import datetime

bcrypt = Bcrypt()
client = MongoClient(Config.MONGO_URI)
try:
    db = client.get_database()
except Exception:
    db = client['college_task_manager']

def seed_data():
    # Clear existing data (optional, but good for clean seed)
    db.users.delete_many({})
    db.tasks.delete_many({})

    # HOD Account
    hod = {
        "name": "Dr. Smith (HOD)",
        "email": "hod@college.edu",
        "password": bcrypt.generate_password_hash("password123").decode('utf-8'),
        "role": "HOD",
        "createdAt": datetime.utcnow()
    }
    
    # Teacher Accounts
    teachers = [
        {
            "name": "Prof. Alan Turing",
            "email": "alan@college.edu",
            "password": bcrypt.generate_password_hash("password123").decode('utf-8'),
            "role": "Teacher",
            "createdAt": datetime.utcnow()
        },
        {
            "name": "Prof. Grace Hopper",
            "email": "grace@college.edu",
            "password": bcrypt.generate_password_hash("password123").decode('utf-8'),
            "role": "Teacher",
            "createdAt": datetime.utcnow()
        }
    ]

    db.users.insert_one(hod)
    db.users.insert_many(teachers)

    print("Database seeded successfully!")
    print("HOD Login: hod@college.edu / password123")
    print("Teacher Login: alan@college.edu / password123")

if __name__ == '__main__':
    seed_data()
