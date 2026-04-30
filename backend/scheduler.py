from datetime import datetime, timedelta
from flask_mail import Message
from models import Task, User, db
from bson import ObjectId


def send_task_reminders(mail):
    """
    Check for tasks due tomorrow and send reminder emails to assigned teachers.
    Run periodically (e.g., once per day).
    """
    try:
        # Get today and tomorrow dates (start and end of day)
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        tomorrow_end = tomorrow.replace(hour=23, minute=59, second=59)

        # Find tasks due tomorrow that are not completed
        tasks_due_tomorrow = list(db.tasks.find({
            "dueDate": {
                "$gte": tomorrow,
                "$lte": tomorrow_end
            },
            "status": {"$ne": "Completed"}
        }))

        if not tasks_due_tomorrow:
            print(f"[{datetime.utcnow()}] No tasks due tomorrow. No reminders to send.")
            return

        print(f"[{datetime.utcnow()}] Found {len(tasks_due_tomorrow)} task(s) due tomorrow. Sending reminders...")

        for task in tasks_due_tomorrow:
            # Check if reminder already sent today (optional: add a flag to track this)
            if task.get('reminderSent'):
                continue

            teacher_id = task.get('assignedTo')
            if not teacher_id:
                continue

            teacher = User.find_by_id(str(teacher_id))
            if not teacher or not teacher.get('email'):
                continue

            teacher_name = teacher.get('name', 'Teacher')
            teacher_email = teacher['email']
            task_name = task.get('taskName', 'Unnamed Task')
            due_date = task.get('dueDate')

            try:
                msg = Message(
                    subject=f"Task Reminder: {task_name} due tomorrow",
                    recipients=[teacher_email],
                    body=(
                        f"Hi {teacher_name},\n\n"
                        f'This is a reminder that your task "{task_name}" is due tomorrow '
                        f'({due_date.strftime("%Y-%m-%d")}).\n\n'
                        "Please complete it as soon as possible.\n\n"
                        "Regards,\nCollege Task Manager Team"
                    )
                )
                mail.send(msg)

                # Mark the reminder as sent
                db.tasks.update_one(
                    {"_id": task['_id']},
                    {"$set": {"reminderSent": True, "reminderSentDate": datetime.utcnow()}}
                )

                print(f"  ✓ Reminder sent to {teacher_name} ({teacher_email}) for task '{task_name}'")
            except Exception as e:
                print(f"  ✗ Failed to send reminder to {teacher_email}: {e}")

    except Exception as e:
        print(f"[{datetime.utcnow()}] Error in send_task_reminders: {e}")


def start_scheduler(app, mail):
    """
    Initialize and start the APScheduler background job.
    """
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler()

    # Schedule the job to run every hour
    scheduler.add_job(
        func=send_task_reminders,
        args=(mail,),
        trigger="interval",
        hours=1,
        id="task_reminder_job",
        name="Send task reminders to teachers",
        replace_existing=True
    )

    try:
        scheduler.start()
        print("[Scheduler] Task reminder scheduler started. Will check every hour for tasks due tomorrow.")
    except Exception as e:
        print(f"[Scheduler] Failed to start scheduler: {e}")

    return scheduler
