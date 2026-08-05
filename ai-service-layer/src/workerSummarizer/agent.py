import json

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from src.config import get_settings
from ..models import WebContentSummary
from .helper import fetch_url_content


def _build_model() -> ChatGroq:
    settings = get_settings()

    return ChatGroq(
        groq_api_key=settings.GROK_API_KEY,
        model="llama-3.3-70b-versatile",
        temperature=0,
    )


_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an expert technical summarizer.

Your task is to generate a high-quality study summary from the provided learning material.

Guidelines:
- Use the webpage content as the primary source whenever available.
- Use the supplemental session content to enrich the summary with additional context, examples, or explanations.
- Produce exactly 10 detailed, information-rich key points.
- Each key point should be self-contained, descriptive, and capture the most important concepts, definitions, algorithms, workflows, best practices, advantages, limitations, or implementation details wherever applicable.
- Do not generate short phrases or headings. Every key point should be 2–4 complete sentences explaining the concept clearly.
- Preserve technical terminology, code-related concepts, and important examples.
- Remove duplicate information while ensuring no important concept is omitted.
- Infer logical connections between the webpage and supplemental content when they discuss the same topic.
- Generate a concise and specific subtopic that best represents the overall learning material.
- Do not include introductory or concluding statements.
- Return structured output only matching the required schema.
""",
        ),
        (
            "human",
            """URL: {url}
Title: {title}

Primary webpage content:
{content}

Supplemental session content:
{supplemental_content}""",
        ),
    ]
)

_REDUCE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """You are an expert summarizer.

Combine the supplied partial summaries into exactly ten concise key points and one subtopic.
Preserve the most important ideas and remove duplication.
Return structured output only.""",
        ),
        (
            "human",
            """URL: {url}
Title: {title}

Partial summaries:
{content}""",
        ),
    ]
)


def _clean_text(content: str | None) -> str:
    return (content or "").strip()


def _chunk_text(content: str, chunk_size: int = 12000, overlap: int = 500) -> list[str]:
    normalized_content = _clean_text(content)
    if not normalized_content:
        return []

    chunks: list[str] = []
    start = 0
    content_length = len(normalized_content)

    while start < content_length:
        end = min(start + chunk_size, content_length)
        chunks.append(normalized_content[start:end])
        if end >= content_length:
            break
        start = max(end - overlap, start + 1)

    return chunks


def summarize_web_content(url: str, supplemental_content: str = "") -> WebContentSummary:
    page_data = {
        "url": url,
        "title": "",
        "content": "",
    }

    webpage_content = ""
    enriched_content = _clean_text(supplemental_content)

    try:
        raw_content = fetch_url_content(url)
        page_data = json.loads(raw_content)
        webpage_content = _clean_text(page_data.get("content", ""))
    except Exception:
        webpage_content = ""

    if webpage_content and enriched_content:
        combined_content = (
            f"{webpage_content}\n\nAdditional session context:\n{enriched_content}"
        )
    elif webpage_content:
        combined_content = webpage_content
    elif enriched_content:
        combined_content = enriched_content
    else:
        raise ValueError(
            "Unable to summarize because neither webpage content nor supplemental content is available."
        )

    llm = _build_model().with_structured_output(WebContentSummary)
    chain = _PROMPT | llm
    reduce_chain = _REDUCE_PROMPT | llm

    content_chunks = _chunk_text(combined_content)

    if len(content_chunks) <= 1:
        return chain.invoke(
            {
                "url": page_data.get("url", url),
                "title": page_data.get("title", ""),
                "content": combined_content,
                "supplemental_content": "",
            }
        )

    partial_summaries: list[str] = []

    for index, chunk in enumerate(content_chunks, start=1):
        chunk_summary = chain.invoke(
            {
                "url": page_data.get("url", url),
                "title": page_data.get("title", ""),
                "content": chunk,
                "supplemental_content": "",
            }
        )

        partial_summaries.append(
            "\n".join(
                [
                    f"Chunk {index} subtopic: {chunk_summary.subtopic}",
                    *[f"- {point}" for point in chunk_summary.key_points],
                ]
            )
        )

    return reduce_chain.invoke(
        {
            "url": page_data.get("url", url),
            "title": page_data.get("title", ""),
            "content": "\n\n".join(partial_summaries),
        }
    )
