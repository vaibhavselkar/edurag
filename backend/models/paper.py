from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PaperRequest(BaseModel):
    board: str                          # CBSE | ICSE | Maharashtra
    grade: str                          # 10 | 11 | 12
    subject: str
    topics: Optional[List[str]] = None  # None = all topics
    total_marks: int = 80
    duration_minutes: int = 180
    question_types: List[str] = ["MCQ", "short_answer", "long_answer"]
    difficulty: str = "medium"          # easy | medium | hard
    include_answer_key: bool = False
    model: Optional[str] = None         # override default Groq model
    # Explicit question counts — when set, override auto-distribution from total_marks
    num_mcq: Optional[int] = None
    num_short: Optional[int] = None
    num_long: Optional[int] = None
    # Marks per question — editable by user
    marks_per_mcq: int = 1
    marks_per_short: int = 2
    marks_per_long: int = 5
    # Paper header info
    institute_name: Optional[str] = None
    tutor_name: Optional[str] = None


class Question(BaseModel):
    type: str           # MCQ | short_answer | long_answer
    question: str
    options: Optional[List[str]] = None  # for MCQ
    answer: Optional[str] = None
    marks: int
    topic: str


class PaperOut(BaseModel):
    id: str
    board: str
    grade: str
    subject: str
    topics: List[str]
    total_marks: int
    duration_minutes: int
    difficulty: str
    questions: List[Question]
    include_answer_key: bool
    created_by: str
    created_at: datetime
