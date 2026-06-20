"""
FastAPI Embeddings Microservice for Startup Hiring & Salary Intelligence RAG Pipeline.
Exposes /ingest and /query endpoints that wrap the LangChain RAG logic.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq

app = FastAPI(
    title="Embeddings Microservice",
    description="FastAPI wrapper around LangChain RAG logic for startup hiring intelligence.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Shared constants
# ---------------------------------------------------------------------------

CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
COLLECTION_NAME = "startup_hiring"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

PROMPT_TEMPLATE = """
You are a startup hiring and compensation expert for the Indian market.
Use only the context provided to answer. Always include salary ranges if present.
If the answer is not in the context, say "I don't have enough data on this."

Context:
{context}

Question: {question}

Answer:
"""

# ---------------------------------------------------------------------------
# Lazy-loaded shared resources
# ---------------------------------------------------------------------------

_embeddings: Optional[HuggingFaceEmbeddings] = None


def get_embeddings() -> HuggingFaceEmbeddings:
    """Return a cached HuggingFace embeddings instance."""
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
    return _embeddings


def get_vectorstore() -> Chroma:
    """Open (or create) the ChromaDB vectorstore."""
    return Chroma(
        persist_directory=CHROMA_PERSIST_DIR,
        embedding_function=get_embeddings(),
        collection_name=COLLECTION_NAME,
    )


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class IngestRequest(BaseModel):
    filename: str
    content: str
    mime_type: str  # "text/markdown" | "text/plain" | "application/pdf"


class IngestResponse(BaseModel):
    chunks_stored: int


class QueryRequest(BaseModel):
    question: str


class SourceDocument(BaseModel):
    content: str
    metadata: dict


class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceDocument]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/ingest", response_model=IngestResponse)
def ingest(request: IngestRequest) -> IngestResponse:
    """
    Split `content` into chunks, embed them and store in ChromaDB.

    Supported mime_types:
      - text/markdown  → MarkdownHeaderTextSplitter (#, ##, ###)
      - text/plain     → RecursiveCharacterTextSplitter(chunk_size=500, overlap=50)
      - application/pdf → treated the same as text/plain (pre-extracted text expected)
    """
    content = request.content

    if request.mime_type == "text/markdown":
        headers_to_split_on = [
            ("#", "role_category"),
            ("##", "role_title"),
            ("###", "sub_section"),
        ]
        splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
        chunks = splitter.split_text(content)
    else:
        # text/plain or application/pdf
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = splitter.create_documents([content])

    if not chunks:
        raise HTTPException(status_code=422, detail="No chunks could be created from the provided content.")

    # Add source filename to metadata
    for chunk in chunks:
        chunk.metadata["source"] = request.filename

    vectorstore = get_vectorstore()
    vectorstore.add_documents(chunks)

    return IngestResponse(chunks_stored=len(chunks))


@app.post("/query", response_model=QueryResponse)
def query(request: QueryRequest) -> QueryResponse:
    """
    Run a RAG query against the ChromaDB vectorstore using Groq (llama-3.1-8b-instant).
    """
    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4},
    )

    docs = retriever.invoke(request.question)

    if not docs:
        return QueryResponse(
            answer="No relevant documents found. Please ingest some documents first.",
            sources=[],
        )

    context = "\n\n".join(doc.page_content for doc in docs)
    filled_prompt = PROMPT_TEMPLATE.format(context=context, question=request.question)

    try:
        llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
        answer = llm.invoke(filled_prompt).content
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("LLM call failed: %s", e)
        raise HTTPException(status_code=503, detail="The AI service is temporarily unavailable. Please try again.")

    sources = [
        SourceDocument(content=doc.page_content, metadata=doc.metadata)
        for doc in docs
    ]

    return QueryResponse(answer=answer, sources=sources)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
def health():
    return {"status": "ok"}
