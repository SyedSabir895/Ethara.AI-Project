from pymongo import MongoClient
from config import Config
from bson import ObjectId

client = MongoClient(Config.MONGO_URI)
# Explicitly get the database name from the URI or use the default
try:
    db = client.get_database()
except Exception:
    db = client['college_task_manager']

class User:
    @staticmethod
    def find_by_email(email):
        return db.users.find_one({"email": email})
    
    @staticmethod
    def find_by_id(user_id):
        return db.users.find_one({"_id": ObjectId(user_id)})
    
    @staticmethod
    def get_all_teachers():
        return list(db.users.find({"role": "Teacher"}, {"password": 0}))

class Task:
    @staticmethod
    def create(task_data):
        return db.tasks.insert_one(task_data)
    
    @staticmethod
    def get_all():
        # Aggregation to join with user data
        pipeline = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "assignedTo",
                    "foreignField": "_id",
                    "as": "assignedTo"
                }
            },
            {"$unwind": "$assignedTo"},
            {"$project": {"assignedTo.password": 0}}
        ]
        return list(db.tasks.aggregate(pipeline))
    
    @staticmethod
    def get_by_teacher(teacher_id):
        pipeline = [
            {"$match": {"assignedTo": ObjectId(teacher_id)}},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "assignedTo",
                    "foreignField": "_id",
                    "as": "assignedTo"
                }
            },
            {"$unwind": "$assignedTo"},
            {"$project": {"assignedTo.password": 0}}
        ]
        return list(db.tasks.aggregate(pipeline))
    
    @staticmethod
    def update_status(task_id, status, remarks=None):
        update_data = {"status": status}
        if status == "Completed":
            from datetime import datetime
            update_data["taskDoneDate"] = datetime.utcnow()
        if remarks:
            update_data["remarks"] = remarks
            
        return db.tasks.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": update_data}
        )
    
    @staticmethod
    def delete(task_id):
        return db.tasks.delete_one({"_id": ObjectId(task_id)})
