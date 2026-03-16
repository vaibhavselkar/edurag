from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import json
from core.database import get_db
from core.security import get_current_user
from models.paper import PaperRequest
from services.paper_generator import generate_paper, flatten_questions
from services.pdf_export import generate_pdf
from core.responses import SafeJSONResponse

router = APIRouter(prefix="/api/papers", tags=["papers"])


def clean(doc: dict) -> dict:
    """Convert MongoDB doc to JSON-safe dict."""
    doc["id"] = str(doc.pop("_id")) if "_id" in doc else doc.get("id", "")
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


@router.get("/test")
async def test_papers():
    db = get_db()
    cursor = db.papers.find({}, {"questions": 0, "sections": 0}).sort("created_at", -1)
    papers = []
    async for paper in cursor:
        papers.append(clean(paper))
    return SafeJSONResponse({"status": "ok", "count": len(papers), "papers": papers})


@router.post("/generate", status_code=201)
async def create_paper(payload: PaperRequest, current_user: dict = Depends(get_current_user)):
    import traceback as tb
    print(f"[ROUTE START] create_paper called by {current_user.get('email','?')}", flush=True)
    try:
        paper_data = generate_paper(
            board=payload.board,
            grade=payload.grade,
            subject=payload.subject,
            topics=payload.topics,
            total_marks=payload.total_marks,
            duration_minutes=payload.duration_minutes,
            question_types=payload.question_types,
            difficulty=payload.difficulty,
            include_answer_key=payload.include_answer_key,
            model=payload.model,
            num_mcq=payload.num_mcq,
            num_short=payload.num_short,
            num_long=payload.num_long,
            marks_per_mcq=payload.marks_per_mcq,
            marks_per_short=payload.marks_per_short,
            marks_per_long=payload.marks_per_long,
        )
    except Exception as e:
        trace = tb.format_exc()
        print(f"[GENERATE ERROR] {type(e).__name__}: {e}\n{trace}", flush=True)
        return SafeJSONResponse({"detail": f"Paper generation failed: {str(e)}", "trace": trace}, status_code=500)

    try:
        questions = flatten_questions(paper_data)
        topics_covered = paper_data.get("topics_covered", payload.topics or [])
    except Exception as e:
        print(f"[FLATTEN ERROR] {e}", flush=True)
        return SafeJSONResponse({"detail": f"flatten failed: {str(e)}"}, status_code=500)

    print(f"[ROUTE] flatten ok, questions={len(questions)}, inserting...", flush=True)
    db = get_db()
    now = datetime.utcnow()
    try:
        doc = {
            "board": payload.board,
            "grade": payload.grade,
            "subject": payload.subject,
            "topics": topics_covered,
            "total_marks": payload.total_marks,
            "duration_minutes": payload.duration_minutes,
            "difficulty": payload.difficulty,
            "questions": questions,
            "sections": paper_data.get("sections", []),
            "include_answer_key": payload.include_answer_key,
            "institute_name": payload.institute_name or "",
            "tutor_name": payload.tutor_name or "",
            "created_by": str(current_user["_id"]),
            "created_by_name": current_user.get("name", ""),
            "created_at": now,
        }
        result = await db.papers.insert_one(doc)
    except Exception as e:
        trace = tb.format_exc()
        print(f"[INSERT ERROR] {type(e).__name__}: {e}\n{trace}", flush=True)
        return SafeJSONResponse({"detail": f"DB insert failed: {str(e)}", "trace": trace}, status_code=500)

    try:
        response_data = {
            "id": str(result.inserted_id),
            "board": payload.board,
            "grade": payload.grade,
            "subject": payload.subject,
            "topics": topics_covered,
            "total_marks": payload.total_marks,
            "duration_minutes": payload.duration_minutes,
            "difficulty": payload.difficulty,
            "questions": questions,
            "sections": paper_data.get("sections", []),
            "include_answer_key": payload.include_answer_key,
            "created_by": str(current_user["_id"]),
            "created_by_name": current_user.get("name", ""),
            "created_at": doc["created_at"].isoformat(),
        }
        return SafeJSONResponse(response_data, status_code=201)
    except Exception as e:
        trace = tb.format_exc()
        print(f"[RESPONSE ERROR] {type(e).__name__}: {e}\n{trace}", flush=True)
        return SafeJSONResponse({"detail": f"Response build failed: {str(e)}", "trace": trace}, status_code=500)


@router.get("/")
async def list_papers(
    board: Optional[str] = None,
    grade: Optional[str] = None,
    subject: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    query: dict = {}

    if current_user.get("role") != "admin":
        query["created_by"] = str(current_user["_id"])

    if board:
        query["board"] = board
    if grade:
        query["grade"] = grade
    if subject:
        query["subject"] = subject

    cursor = db.papers.find(query, {"questions": 0, "sections": 0}).sort("created_at", -1)
    papers = []
    async for paper in cursor:
        papers.append(clean(paper))
    return SafeJSONResponse(papers)


@router.get("/{paper_id}")
async def get_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    paper = await db.papers.find_one({"_id": ObjectId(paper_id)})
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if current_user.get("role") != "admin" and paper.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    return SafeJSONResponse(clean(paper))


@router.get("/{paper_id}/download")
async def download_paper(
    paper_id: str,
    answer_key: bool = False,
    template: str = "standard",
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    paper = await db.papers.find_one({"_id": ObjectId(paper_id)})
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if current_user.get("role") != "admin" and paper.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    pdf_bytes = generate_pdf(paper, include_answer_key=answer_key, template=template)
    filename = f"paper_{paper['board']}_{paper['grade']}_{paper['subject']}_{template}.pdf".replace(" ", "_")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.patch("/{paper_id}")
async def update_paper(
    paper_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    paper = await db.papers.find_one({"_id": ObjectId(paper_id)})
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    if current_user.get("role") != "admin" and paper.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    update: dict = {}
    if "sections" in payload:
        sections = payload["sections"]
        update["sections"] = sections
        # Rebuild flat questions from updated sections
        questions = []
        for section in sections:
            qt = section.get("type", "short_answer")
            for q in section.get("questions", []):
                questions.append({
                    "type": qt,
                    "question": q.get("question", ""),
                    "options": q.get("options"),
                    "answer": q.get("answer"),
                    "marks": q.get("marks", 1),
                    "topic": q.get("topic", ""),
                    "section": section.get("section_name", ""),
                })
        update["questions"] = questions
        update["total_marks"] = sum(q["marks"] for q in questions)

    for field in ("institute_name", "tutor_name"):
        if field in payload:
            update[field] = payload[field]

    if update:
        await db.papers.update_one({"_id": ObjectId(paper_id)}, {"$set": update})

    updated = await db.papers.find_one({"_id": ObjectId(paper_id)})
    return SafeJSONResponse(clean(updated))


@router.delete("/{paper_id}", status_code=204)
async def delete_paper(paper_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    paper = await db.papers.find_one({"_id": ObjectId(paper_id)})
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if current_user.get("role") != "admin" and paper.get("created_by") != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    await db.papers.delete_one({"_id": ObjectId(paper_id)})
