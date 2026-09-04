"""
Parent dashboard routes (protected — parent role required).

GET  /parent/me              — parent profile
GET  /parent/children        — list all linked children (unique numbers)
POST /parent/children/add    — link an additional child to this parent account
GET  /parent/children/{student_unique_number}/profile      — get a specific child's profile
GET  /parent/children/{student_unique_number}/quiz-result  — child's latest diagnostic result
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_session
from src.core.dependencies import get_current_parent
from src.models.parent import Parent
from src.schemas.auth import AddChildRequest
from src.schemas.learning import ClassLeaderboardOut, StudentDetailedProgressOut, StudentProgressOut
from src.schemas.parent import ChildLinkOut, ParentProfile
from src.schemas.quiz import GapReportOut
from src.schemas.student import StudentProfile
from src.schemas.teacher import StudentTestResultSummaryOut
from src.services import assessment_progress_service, learning_progress_service, parent_service, quiz_service

router = APIRouter(prefix="/parent", tags=["Parent Dashboard"])


@router.get("/me", response_model=ParentProfile, summary="Get parent profile")
async def get_parent_profile(parent: Parent = Depends(get_current_parent)):
    return ParentProfile.model_validate(parent)


@router.get(
    "/children",
    response_model=list[ChildLinkOut],
    summary="List all children linked to this parent account",
)
async def get_children(
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    return await parent_service.get_parent_children(parent, session)


@router.post(
    "/children/add",
    response_model=ChildLinkOut,
    status_code=status.HTTP_201_CREATED,
    summary="Link an additional child to this parent account",
)
async def add_child(
    data: AddChildRequest,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    return await parent_service.add_child_to_parent(parent, data, session)


@router.get(
    "/children/{student_unique_number}/profile",
    response_model=StudentProfile,
    summary="Get a specific child's profile (parent must be linked to this student)",
)
async def get_child_profile(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    student = await parent_service.get_owned_student(parent, student_unique_number, session)
    return StudentProfile.model_validate(student)


@router.get(
    "/children/{student_unique_number}/quiz-result",
    response_model=GapReportOut,
    summary="Get a specific child's latest diagnostic quiz result (parent must be linked)",
)
async def get_child_quiz_result(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    student = await parent_service.get_owned_student(parent, student_unique_number, session)
    attempt = await quiz_service.get_latest_completed_attempt(student.id, session)
    if attempt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This student has not completed their diagnostic assessment yet.",
        )
    report = await quiz_service.compute_gap_report(attempt, session)
    return GapReportOut(**report)


@router.get(
    "/children/{student_unique_number}/test-results",
    response_model=list[StudentTestResultSummaryOut],
    summary="Get a specific child's full test attempt history, scores, pass/fail status, teacher feedback, and AI advice",
)
async def get_child_test_results(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    from src.schemas.teacher import AssignmentOut, AssignmentAttemptOut, FeedbackOut, SubmissionOut
    from src.services import teacher_service
    student = await parent_service.get_owned_student(parent, student_unique_number, session)
    raw_results = await teacher_service.get_student_all_test_results(student, session)
    
    out = []
    for item in raw_results:
        sub = item["submission"]
        sub_out = SubmissionOut.model_validate(sub) if sub else None
        fb = item["teacher_feedback"]
        fb_out = FeedbackOut.model_validate(fb) if fb else None

        out.append(StudentTestResultSummaryOut(
            assignment=AssignmentOut.model_validate(item["assignment"]),
            submission=sub_out,
            attempts=[AssignmentAttemptOut.model_validate(a) for a in item["attempts"]],
            teacher_feedback=fb_out,
        ))
    return out


@router.get(
    "/children/{student_unique_number}/progress",
    response_model=StudentProgressOut,
    summary="Get a specific child's per-module learning progress, points, and daily streaks",
)
async def get_child_learning_progress(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    student = await parent_service.get_owned_student(parent, student_unique_number, session)
    return await learning_progress_service.get_student_progress(student, session)


@router.get(
    "/children/{student_unique_number}/detailed-progress",
    response_model=StudentDetailedProgressOut,
    summary="Get a specific child's comprehensive assessment growth, consecutive test trends, lagging topics, and curriculum progress",
)
async def get_child_detailed_progress(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    from src.services import assessment_progress_service
    student = await parent_service.get_owned_student(parent, student_unique_number, session)
    return await assessment_progress_service.calculate_student_detailed_progress(student, session)


@router.get(
    "/children/{student_unique_number}/leaderboard",
    response_model=ClassLeaderboardOut,
    summary="Class leaderboard — top 10 students + child's own rank, ranked by holistic mastery",
)
async def get_child_leaderboard(
    student_unique_number: str,
    parent: Parent = Depends(get_current_parent),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns the top 10 students in the child's class/section ranked by
    holistic_mastery_percent (avg test score + improvement trajectory).

    my_entry is always set to the child's own ranked row so the parent can see
    exactly where their child stands, even if the child is outside the top 10.

    Only available for school-enrolled children who have completed class setup.
    """
    from fastapi import HTTPException, status
    from src.models.student import Student as StudentModel
    from sqlmodel import select as sql_select

    student = await parent_service.get_owned_student(parent, student_unique_number, session)

    if (student.enrollment_type or "school") != "school":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The class leaderboard is only available for school-enrolled students.",
        )
    if student.class_number is None or student.section is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This child has not completed class setup yet.",
        )

    students_result = await session.execute(
        sql_select(StudentModel).where(
            StudentModel.branch_name == student.branch_name,
            StudentModel.class_number == student.class_number,
            StudentModel.section == student.section,
            StudentModel.enrollment_type == "school",
        )
    )
    class_students = list(students_result.scalars().all())

    # Full ranked list in one pass; slice top 10 and find the child's entry
    full_board = await assessment_progress_service.get_class_leaderboard(
        class_students, student.class_number, student.section, session,
        top_n=len(class_students),
    )

    my_entry = next(
        (e for e in full_board.top_entries if e.student_id == student.id), None
    )

    full_board.top_entries = full_board.top_entries[:10]
    full_board.my_entry = my_entry
    return full_board
