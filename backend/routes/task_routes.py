from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Task, User, db
from bson import ObjectId
from datetime import datetime, timedelta
from flask_mail import Message

task_bp = Blueprint('tasks', __name__)


def send_task_assignment_email(teacher, task_name, priority, due_date, remarks):
    from app import mail

    if not teacher or not teacher.get('email'):
        return False

    teacher_name = teacher.get('name') or 'Teacher'
    remark_text = remarks or 'No additional remarks provided.'

    msg = Message(
        subject=f"New Task Assigned: {task_name}",
        recipients=[teacher['email']],
        body=(
            f"Hi {teacher_name},\n\n"
            f'A new task "{task_name}" has been assigned to you.\n\n'
            f"Priority: {priority}\n"
            f"Due Date: {due_date.strftime('%Y-%m-%d')}\n"
            f"Remarks: {remark_text}\n\n"
            "Please login to the dashboard to review and complete it.\n\n"
            "Regards,\nCollege Task Manager Team"
        )
    )
    mail.send(msg)
    return True

@task_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    tasks = Task.get_all()
    # Convert ObjectIds to strings
    for task in tasks:
        task['_id'] = str(task['_id'])
        if 'assignedTo' in task and isinstance(task['assignedTo'], list):
            for teacher in task['assignedTo']:
                teacher['_id'] = str(teacher['_id'])
    return jsonify(tasks), 200

@task_bp.route('/tasks/my-tasks', methods=['GET'])
@jwt_required()
def get_my_tasks():
    user_id = get_jwt_identity()
    tasks = Task.get_by_teacher(user_id)
    for task in tasks:
        task['_id'] = str(task['_id'])
        if 'assignedTo' in task and isinstance(task['assignedTo'], list):
            for teacher in task['assignedTo']:
                teacher['_id'] = str(teacher['_id'])
    return jsonify(tasks), 200

@task_bp.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    data = request.get_json()
    
    assigned_to_input = data.get('assignedTo')
    task_name = data.get('taskName')
    project_name = data.get('projectName', 'General')
    priority = data.get('priority')
    days_to_complete = data.get('daysToComplete')
    remarks = data.get('remarks')

    if not assigned_to_input or not task_name or not priority or not days_to_complete:
        return jsonify({"message": "Missing required task fields"}), 400
    
    # Handle both single ID and list of IDs
    if isinstance(assigned_to_input, list):
        assigned_to_ids = assigned_to_input
    else:
        assigned_to_ids = [assigned_to_input]
    
    # Calculate due date
    due_date = datetime.utcnow() + timedelta(days=days_to_complete)
    
    new_task = {
        "projectName": project_name,
        "taskName": task_name,
        "priority": priority,
        "assignedTo": [ObjectId(tid) for tid in assigned_to_ids if tid],
        "assignedDate": datetime.utcnow(),
        "dueDate": due_date,
        "status": "Pending",
        "remarks": remarks
    }
    
    result = Task.create(new_task)
    
    # Send email notifications to all assigned teachers
    emails_sent_count = 0
    for tid in assigned_to_ids:
        try:
            teacher = User.find_by_id(tid)
            if send_task_assignment_email(teacher, task_name, priority, due_date, remarks):
                emails_sent_count += 1
        except Exception as e:
            print(f"Error sending task assignment email to {tid}: {e}")
            
    return jsonify({
        "message": f"Task created successfully and assigned to {len(assigned_to_ids)} teacher(s)",
        "id": str(result.inserted_id),
        "emailsSent": emails_sent_count
    }), 201

@task_bp.route('/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    Task.delete(task_id)
    return jsonify({"message": "Task deleted successfully"}), 200

@task_bp.route('/tasks/<task_id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(task_id):
    data = request.get_json()
    status = data.get('status')
    remarks = data.get('remarks')
    
    Task.update_status(task_id, status, remarks)
    return jsonify({"message": "Task updated successfully"}), 200

@task_bp.route('/tasks/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    now = datetime.utcnow()
    
    # Total tasks
    total_tasks = db.tasks.count_documents({})
    
    # Completed tasks
    completed_tasks = db.tasks.count_documents({"status": "Completed"})
    
    # Overdue tasks
    overdue_tasks = db.tasks.count_documents({
        "status": {"$ne": "Completed"},
        "dueDate": {"$lt": now}
    })
    
    # Tasks by priority
    priority_pipeline = [
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]
    tasks_by_priority = list(db.tasks.aggregate(priority_pipeline))
    
    # Completion trend (last 7 days)
    seven_days_ago = now - timedelta(days=7)
    trend_pipeline = [
        {"$match": {"status": "Completed", "taskDoneDate": {"$gte": seven_days_ago}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$taskDoneDate"}},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    completion_trend = list(db.tasks.aggregate(trend_pipeline))
    
    return jsonify({
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "overdueTasks": overdue_tasks,
        "tasksByPriority": tasks_by_priority,
        "completionTrend": completion_trend
    }), 200
