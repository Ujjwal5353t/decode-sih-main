"""
Permission and RBAC Feature schemas for VidyaSetu.
Defines navigation tabs, action capabilities, and role permission sets.
"""

from typing import List, Optional
from pydantic import BaseModel


class PermissionAction(BaseModel):
    key: str
    label: str
    description: str


class DashboardPermissionItem(BaseModel):
    id: str                  # unique tab key, e.g. "overview", "classes", "assignments", etc.
    label: str               # Human-readable title
    description: str         # Subtitle or explanation
    icon: str                # Icon name: "LayoutDashboard", "BookOpen", "FileText", "Users", "UserCog", "GraduationCap", "Building2", "Sparkles", "Brain", "Award", "ShieldCheck", "Layers"
    category: Optional[str] = "General"
    badge: Optional[str] = None
    is_default: bool = False
    actions: List[PermissionAction] = []


class RolePermissionsResponse(BaseModel):
    role: str
    role_label: str
    capabilities: List[str]
    navigation: List[DashboardPermissionItem]
