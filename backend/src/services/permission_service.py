"""
Permission service — maps system roles to their allowed dashboard features,
sidebar navigation items, and action capabilities.
"""

from typing import Dict
from src.schemas.permission import (
    DashboardPermissionItem,
    PermissionAction,
    RolePermissionsResponse,
)

ROLE_PERMISSIONS: Dict[str, RolePermissionsResponse] = {
    "teacher": RolePermissionsResponse(
        role="teacher",
        role_label="Educator / Teacher",
        capabilities=[
            "can_view_profile",
            "can_preview_class",
            "can_view_student_roster",
            "can_view_class_modules",
            "can_create_pdf_assignment",
            "can_create_ai_quiz",
            "can_edit_assignment",
            "can_delete_assignment",
            "can_review_submissions",
            "can_grade_submissions",
            "can_provide_feedback",
            "can_browse_ncert_library",
        ],
        navigation=[
            DashboardPermissionItem(
                id="overview",
                label="Teacher Overview",
                description="Profile summary, branch details, and active assigned classes",
                icon="LayoutDashboard",
                category="Main",
                is_default=True,
                actions=[
                    PermissionAction(key="view_profile", label="View Profile", description="Access teacher account details"),
                    PermissionAction(key="view_class_stats", label="Class Metrics", description="Summary of assigned student count"),
                ],
            ),
            DashboardPermissionItem(
                id="classes",
                label="Assigned Classes",
                description="Preview your assigned class sections, student rosters, and curriculum",
                icon="Users",
                category="Academics",
                actions=[
                    PermissionAction(key="preview_class", label="Preview Class", description="View class details and active section"),
                    PermissionAction(key="view_student_roster", label="Student Roster", description="List all enrolled students in your class"),
                    PermissionAction(key="view_class_modules", label="Class Modules", description="Inspect subject modules available to students"),
                ],
            ),
            DashboardPermissionItem(
                id="assignments",
                label="Assignments & Quizzes",
                description="Create and manage PDF homework and adaptive AI quizzes",
                icon="FileText",
                category="Academics",
                badge="Tasks",
                actions=[
                    PermissionAction(key="create_pdf_assignment", label="Upload PDF Assignment", description="Upload homework PDF with deadline"),
                    PermissionAction(key="create_ai_quiz", label="Create AI Quiz", description="Generate adaptive quiz from curriculum modules"),
                    PermissionAction(key="edit_assignment", label="Edit Assignment", description="Update title, description, or deadlines"),
                    PermissionAction(key="delete_assignment", label="Delete Assignment", description="Remove assignment from class"),
                ],
            ),
            DashboardPermissionItem(
                id="grading",
                label="Submissions & Grading",
                description="Review student attempts, assign scores, and provide individualized feedback",
                icon="Award",
                category="Evaluation",
                actions=[
                    PermissionAction(key="review_submissions", label="Review Submissions", description="Inspect student completed work"),
                    PermissionAction(key="grade_submissions", label="Score Assessment", description="Enter scores out of 100"),
                    PermissionAction(key="provide_feedback", label="Student Feedback", description="Write direct feedback to guide student learning"),
                ],
            ),
            DashboardPermissionItem(
                id="curriculum",
                label="Curriculum & Books",
                description="Browse NCERT books and school learning materials",
                icon="BookOpen",
                category="Resources",
                actions=[
                    PermissionAction(key="browse_ncert_library", label="Browse NCERT Library", description="Access textbook chapters and materials"),
                ],
            ),
        ],
    ),
    "student": RolePermissionsResponse(
        role="student",
        role_label="Student Learner",
        capabilities=[
            "can_view_profile",
            "can_setup_class",
            "can_read_school_modules",
            "can_read_ncert_books",
            "can_view_assignments",
            "can_submit_assignment",
            "can_view_teacher_feedback",
            "can_take_practice_quizzes",
        ],
        navigation=[
            DashboardPermissionItem(
                id="overview",
                label="Student Overview",
                description="Student profile, enrolled class, unique student number, and learning metrics",
                icon="LayoutDashboard",
                category="Main",
                is_default=True,
                actions=[
                    PermissionAction(key="view_profile", label="View Profile", description="Access student information and ID"),
                    PermissionAction(key="setup_class", label="Class Setup", description="Configure enrolled class and section"),
                ],
            ),
            DashboardPermissionItem(
                id="modules",
                label="Learning Modules",
                description="Read school-provided chapters and NCERT interactive textbooks",
                icon="BookOpen",
                category="Learning",
                actions=[
                    PermissionAction(key="read_school_modules", label="School Modules", description="Access curriculum study PDFs"),
                    PermissionAction(key="read_ncert_books", label="NCERT Library", description="Access digitized textbook collection"),
                ],
            ),
            DashboardPermissionItem(
                id="assignments",
                label="Class Assignments",
                description="Complete pending homework, submit solutions, and view teacher marks and feedback",
                icon="FileText",
                category="Learning",
                badge="Active",
                actions=[
                    PermissionAction(key="view_assignments", label="View Assignments", description="Inspect assigned homework"),
                    PermissionAction(key="submit_assignment", label="Submit Assignment", description="Mark assignments as submitted"),
                    PermissionAction(key="view_teacher_feedback", label="Teacher Feedback", description="Read teacher guidance and scores"),
                ],
            ),
            DashboardPermissionItem(
                id="quizzes",
                label="AI Practice Quizzes",
                description="Interactive AI-generated concept tests and diagnostic exercises",
                icon="Sparkles",
                category="Practice",
                actions=[
                    PermissionAction(key="take_practice_quizzes", label="Take Quizzes", description="Interactive adaptive quiz assessments"),
                ],
            ),
        ],
    ),
    "school": RolePermissionsResponse(
        role="school",
        role_label="School Branch Administrator",
        capabilities=[
            "can_view_school_profile",
            "can_upload_pdf_module",
            "can_upload_image_module",
            "can_edit_module",
            "can_delete_module",
            "can_link_ncert_books",
            "can_review_admin_claims",
            "can_manage_teachers",
            "can_assign_teacher_classes",
            "can_deassign_teacher_classes",
        ],
        navigation=[
            DashboardPermissionItem(
                id="overview",
                label="Branch Overview",
                description="School branch profile, student prefix, and academic summary",
                icon="LayoutDashboard",
                category="Main",
                is_default=True,
                actions=[
                    PermissionAction(key="view_school_profile", label="School Profile", description="View school and branch configuration"),
                ],
            ),
            DashboardPermissionItem(
                id="modules",
                label="Curriculum Modules",
                description="Upload, update, and manage PDF and image OCR modules for Classes 1 to 5",
                icon="Layers",
                category="Curriculum",
                badge="Core",
                actions=[
                    PermissionAction(key="upload_pdf_module", label="Upload PDF Module", description="Add standard PDF curriculum content"),
                    PermissionAction(key="upload_image_module", label="Image-to-PDF OCR", description="Convert textbook photos into OCR PDF"),
                    PermissionAction(key="delete_module", label="Delete Module", description="Remove module from class syllabus"),
                ],
            ),
            DashboardPermissionItem(
                id="admin-requests",
                label="Administrator Requests",
                description="Approve or reject people requesting administrator access to your school",
                icon="ShieldCheck",
                category="Staff",
                actions=[
                    PermissionAction(key="review_admin_claims", label="Review Requests", description="Approve or reject administrator access requests"),
                ],
            ),
            DashboardPermissionItem(
                id="teachers",
                label="Teacher Directory & Classes",
                description="Manage registered branch teachers and assign or de-assign class sections (e.g. 4th A)",
                icon="UserCog",
                category="Staff",
                badge="Admin",
                actions=[
                    PermissionAction(key="manage_teachers", label="Teacher Directory", description="View registered branch educators"),
                    PermissionAction(key="assign_teacher_classes", label="Assign Class", description="Assign class and section to teacher"),
                    PermissionAction(key="deassign_teacher_classes", label="De-assign Class", description="Remove class section assignment"),
                ],
            ),
        ],
    ),
    "parent": RolePermissionsResponse(
        role="parent",
        role_label="Parent & Guardian",
        capabilities=[
            "can_view_parent_profile",
            "can_link_children",
            "can_monitor_child_modules",
            "can_monitor_child_assignments",
            "can_view_child_scores",
            "can_view_child_teacher_feedback",
        ],
        navigation=[
            DashboardPermissionItem(
                id="overview",
                label="Parent Overview",
                description="Parent account details and quick summary of linked children",
                icon="LayoutDashboard",
                category="Main",
                is_default=True,
                actions=[
                    PermissionAction(key="view_parent_profile", label="Parent Profile", description="Access parent profile details"),
                ],
            ),
            DashboardPermissionItem(
                id="children",
                label="My Children",
                description="Monitor linked children, enrolled classes, learning modules, assignments, and grades",
                icon="Users",
                category="Family",
                badge="Linked",
                actions=[
                    PermissionAction(key="link_children", label="Link Child", description="Link additional child with Student ID or phone"),
                    PermissionAction(key="monitor_child_modules", label="Curriculum Progress", description="Inspect school & NCERT materials"),
                    PermissionAction(key="monitor_child_assignments", label="Homework & Quizzes", description="Track submissions and teacher marks"),
                ],
            ),
        ],
    ),
    "admin": RolePermissionsResponse(
        role="admin",
        role_label="Super Administrator",
        capabilities=[
            "can_view_admin_metrics",
            "can_manage_ncert_master",
            "can_upload_ncert_pdf",
            "can_edit_ncert_book",
            "can_delete_ncert_book",
            "can_view_all_schools",
            "can_review_school_registrations",
        ],
        navigation=[
            DashboardPermissionItem(
                id="overview",
                label="System Overview",
                description="Platform status, system health, and overall institution statistics",
                icon="ShieldCheck",
                category="System",
                is_default=True,
                actions=[
                    PermissionAction(key="view_admin_metrics", label="Platform Metrics", description="Superadmin analytics and counts"),
                ],
            ),
            DashboardPermissionItem(
                id="ncert_master",
                label="NCERT Master Catalogue",
                description="Central textbook repository: upload, edit, detach, and delete official NCERT book PDFs",
                icon="BookOpen",
                category="Management",
                badge="Master",
                actions=[
                    PermissionAction(key="manage_ncert_master", label="Create Books", description="Add new official NCERT textbook entries"),
                    PermissionAction(key="upload_ncert_pdf", label="Upload PDF Content", description="Attach master PDF textbook files"),
                    PermissionAction(key="delete_ncert_book", label="Delete Books", description="Remove textbook entries from platform"),
                ],
            ),
            DashboardPermissionItem(
                id="school-requests",
                label="School Requests",
                description="Schools awaiting platform approval before their administrator gets access",
                icon="ClipboardCheck",
                category="Registrations",
                badge="Review",
                actions=[
                    PermissionAction(key="review_school_registrations", label="Review Requests", description="Approve or reject school registration requests"),
                ],
            ),
            DashboardPermissionItem(
                id="schools",
                label="Registered Institutions",
                description="Directory of all registered school branches and administrator accounts across India",
                icon="Building2",
                category="Management",
                actions=[
                    PermissionAction(key="view_all_schools", label="School Directory", description="List and filter all school branches"),
                ],
            ),
        ],
    ),
}


def get_permissions_for_role(role: str) -> RolePermissionsResponse:
    clean_role = role.lower().strip()
    if clean_role in ROLE_PERMISSIONS:
        return ROLE_PERMISSIONS[clean_role]
    # Fallback default
    return RolePermissionsResponse(
        role=clean_role,
        role_label=clean_role.capitalize(),
        capabilities=[],
        navigation=[
            DashboardPermissionItem(
                id="overview",
                label="Dashboard Overview",
                description="Dashboard home",
                icon="LayoutDashboard",
                is_default=True,
            )
        ],
    )
