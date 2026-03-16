import os
import uuid
import pdfplumber
from typing import List, Dict
from core.config import settings


def save_upload(file_bytes: bytes, filename: str) -> str:
    os.makedirs(settings.upload_dir, exist_ok=True)
    unique_name = f"{uuid.uuid4()}_{filename}"
    path = os.path.join(settings.upload_dir, unique_name)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return unique_name


def extract_text_chunks(filename: str, chunk_size: int = 800, overlap: int = 100) -> List[Dict]:
    path = os.path.join(settings.upload_dir, filename)
    full_text = ""

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    words = full_text.split()
    chunks = []
    i = 0
    chunk_index = 0

    while i < len(words):
        chunk_words = words[i: i + chunk_size]
        chunk_text = " ".join(chunk_words)
        chunks.append({
            "chunk_index": chunk_index,
            "text": chunk_text,
        })
        i += chunk_size - overlap
        chunk_index += 1

    return chunks
