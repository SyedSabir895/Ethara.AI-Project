from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Task, User, db
from bson import ObjectId
from datetime import datetime, timedelta
from flask_mail import Message
import threading

task_bp = Blueprint('tasks', __name__)


# ========================= EMAIL FUNCTION =========================
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

    if not getattr(mail, 'server', None) or not getattr(mail, 'port', None):
        current_app.logger.warning('Mail server not configured; skipping email')
        return False

    # ✅ Capture real app instance BEFORE thread starts
    app = current_app._get_current_object()

    def _send(msg, app):
        with app.app_context():
            try:
                mail.send(msg)
                app.logger.info(f"Email sent to {teacher.get('email')}")
            except Exception as e:
                app.logger.error(f"Email failed: {e}")

    thread = threading.Thread(target=_send, args=(msg, app))
    thread.start()

    return True

# ========================= GET ALL TASKS =========================
@task_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_tasks():
    tasks = Task.get_all()

    for task in tasks:
        task['_id'] = str(task['_id'])
        if 'assignedTo' in task and isinstance(task['assignedTo'], list):
            for teacher in task['assignedTo']:
                teacher['_id'] = str(teacher['_id'])

    return jsonify(tasks), 200


# ========================= GET MY TASKS =========================
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


# ========================= CREATE TASK =========================
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

    # Validate required fields
    if not assigned_to_input or not task_name or not priority or not days_to_complete:
        return jsonify({"message": "Missing required fields"}), 400

    # Convert days safely
    try:
        days_to_complete = int(days_to_complete)
    except:
        return jsonify({"message": "daysToComplete must be a number"}), 400

    # Normalize assigned IDs
    assigned_to_ids = assigned_to_input if isinstance(assigned_to_input, list) else [assigned_to_input]

    # Convert to ObjectId safely
    assigned_to = []
    for tid in assigned_to_ids:
        try:
            assigned_to.append(ObjectId(tid))
        except:
            continue

    if not assigned_to:
        return jsonify({"message": "Invalid assignedTo IDs"}), 400

    due_date = datetime.utcnow() + timedelta(days=days_to_complete)

    new_task = {
        "projectName": project_name,
        "taskName": task_name,
        "priority": priority,
        "assignedTo": assigned_to,
        "assignedDate": datetime.utcnow(),
        "dueDate": due_date,
        "status": "Pending",
        "remarks": remarks
    }

    result = Task.create(new_task)

    # Send Emails
    emails_sent_count = 0

    for tid in assigned_to_ids:
        try:
            teacher = User.find_by_id(tid)
            if not teacher:
                current_app.logger.warning(f"Teacher not found: {tid}")
                continue

            if send_task_assignment_email(teacher, task_name, priority, due_date, remarks):
                emails_sent_count += 1

        except Exception as e:
            current_app.logger.error(f"Email error for {tid}: {e}")

    return jsonify({
        "message": f"Task created and assigned to {len(assigned_to)} teacher(s)",
        "id": str(result.inserted_id),
        "emailsSent": emails_sent_count
    }), 201


# ========================= DELETE TASK =========================
@task_bp.route('/tasks/<task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    Task.delete(task_id)
    return jsonify({"message": "Task deleted successfully"}), 200


# ========================= UPDATE STATUS =========================
@task_bp.route('/tasks/<task_id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(task_id):
    data = request.get_json()

    status = data.get('status')
    remarks = data.get('remarks')

    valid_status = ["Pending", "In Progress", "Completed"]

    if status not in valid_status:
        return jsonify({"message": "Invalid status"}), 400

    Task.update_status(task_id, status, remarks)

    return jsonify({"message": "Task updated successfully"}), 200


# ========================= ANALYTICS =========================
@task_bp.route('/tasks/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    now = datetime.utcnow()

    total_tasks = db.tasks.count_documents({})
    completed_tasks = db.tasks.count_documents({"status": "Completed"})

    overdue_tasks = db.tasks.count_documents({
        "status": {"$ne": "Completed"},
        "dueDate": {"$lt": now}
    })

    tasks_by_priority = list(db.tasks.aggregate([
        {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
    ]))

    seven_days_ago = now - timedelta(days=7)

    completion_trend = list(db.tasks.aggregate([
        {"$match": {"status": "Completed", "taskDoneDate": {"$gte": seven_days_ago}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$taskDoneDate"}},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]))

    return jsonify({
        "totalTasks": total_tasks,
        "completedTasks": completed_tasks,
        "overdueTasks": overdue_tasks,
        "tasksByPriority": tasks_by_priority,
        "completionTrend": completion_trend
    }), 200