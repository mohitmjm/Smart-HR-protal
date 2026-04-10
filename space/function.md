{
  "apply_leave": {
    "pages": ["leaves"],
    "parameters": ["date_range", "leave_type", "reason"]
  },
  "approve_leave": {
    "pages": ["leaves"],
    "parameters": ["for_whom", "which_application", "approval_status"]
  },
  "clock_in": {
    "pages": ["attendance", "dashboard"],
    "parameters": ["location", "timestamp", "gps_coordinates"]
  },
  "clock_out": {
    "pages": ["attendance", "dashboard"],
    "parameters": ["location", "timestamp", "gps_coordinates"]
  },
  "view_attendance_history": {
    "pages": ["attendance"],
    "parameters": ["date_range", "user_id", "status_filter"]
  },
  "get_leave_balance": {
    "pages": ["leaves", "profile"],
    "parameters": ["user_id", "leave_type"]
  },
  "view_team_attendance": {
    "pages": ["team"],
    "parameters": ["team_id", "date_range", "status_filter"]
  },
  "view_team_leaves": {
    "pages": ["team"],
    "parameters": ["team_id", "status_filter", "date_range"]
  },
  "update_profile": {
    "pages": ["profile"],
    "parameters": ["personal_info", "contact_details", "emergency_contact"]
  },
  "upload_document": {
    "pages": ["documents", "profile"],
    "parameters": ["file", "document_type", "description"]
  },
  "view_documents": {
    "pages": ["documents"],
    "parameters": ["document_type", "date_range", "access_level"]
  },
  "view_analytics": {
    "pages": ["dashboard"],
    "parameters": ["date_range", "metric_type", "department_filter"]
  },
  "view_notifications": {
    "pages": ["notifications", "dashboard"],
    "parameters": ["notification_type", "date_range", "status"]
  },
  "send_notification": {
    "pages": ["team"],
    "parameters": ["recipient_ids", "message", "notification_type", "priority"]
  },
  "voice_command": {
    "pages": ["voice-chat", "dashboard"],
    "parameters": ["command_text", "action_type", "target_page"]
  },
  "regularization_request": {
    "pages": ["attendance"],
    "parameters": ["date", "reason", "requested_time", "justification"]
  },
  "approve_regularization": {
    "pages": ["team"],
    "parameters": ["request_id", "approval_status", "comments"]
  },
  "view_leave_stats": {
    "pages": ["leaves", "dashboard"],
    "parameters": ["user_id", "date_range", "leave_type"]
  },
  "view_team_stats": {
    "pages": ["team"],
    "parameters": ["team_id", "date_range", "metric_type"]
  },
  "schedule_meeting": {
    "pages": ["team", "dashboard"],
    "parameters": ["participants", "date_time", "duration", "meeting_type"]
  },
  "view_calendar": {
    "pages": ["dashboard", "leaves"],
    "parameters": ["date_range", "view_type", "filters"]
  },
  "request_time_off": {
    "pages": ["leaves"],
    "parameters": ["start_date", "end_date", "leave_type", "reason"]
  },
  "view_payroll": {
    "pages": ["profile"],
    "parameters": ["user_id", "pay_period", "salary_components"]
  },
  "update_emergency_contact": {
    "pages": ["profile"],
    "parameters": ["contact_name", "relationship", "phone", "email"]
  },
  "view_company_policies": {
    "pages": ["documents", "settings"],
    "parameters": ["policy_type", "version", "department"]
  },
  "submit_feedback": {
    "pages": ["settings", "team"],
    "parameters": ["feedback_type", "message", "recipient", "priority"]
  },
  "view_performance": {
    "pages": ["profile"],
    "parameters": ["user_id", "period", "metrics"]
  },
  "schedule_review": {
    "pages": ["team"],
    "parameters": ["user_id", "review_date", "reviewer_id", "type"]
  }
}
