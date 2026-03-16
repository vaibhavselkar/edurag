from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DocumentCreate(BaseModel):
    board: str          # CBSE | ICSE | Maharashtra
    grade: str          # 10 | 11 | 12
    subject: str        # Physics | Chemistry | Math | Biology | etc.
    topics: List[str]   # ["Circular Motion", "Gravitation"]
    title: str


class DocumentOut(BaseModel):
    id: str
    board: str
    grade: str
    subject: str
    topics: List[str]
    title: str
    filename: str
    chunk_count: int
    uploaded_by: str
    created_at: datetime
