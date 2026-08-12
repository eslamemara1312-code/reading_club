import pytest
from httpx import AsyncClient


SAMPLE_PDF_BYTES = (
    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n"
    b"trailer\n<< /Root 1 0 R >>\n%%EOF\n"
)


@pytest.mark.asyncio
async def test_reader_annotations_are_private_to_the_reader_and_book(
    client: AsyncClient,
):
    owner = await client.post("/api/v1/auth/register", json={
        "name": "Reader Owner", "email": "annotation-owner@example.com", "password": "password123",
    })
    owner_headers = {"Authorization": f"Bearer {owner.json()['access_token']}"}

    outsider = await client.post("/api/v1/auth/register", json={
        "name": "Reader Outsider", "email": "annotation-outsider@example.com", "password": "password123",
    })
    outsider_headers = {"Authorization": f"Bearer {outsider.json()['access_token']}"}

    group = await client.post("/api/v1/groups", json={"name": "Annotation Club"}, headers=owner_headers)
    group_id = group.json()["id"]
    book = await client.post("/api/v1/books", json={
        "title": "Reader Notes", "author": "Club", "total_pages": 100,
    }, headers=owner_headers)
    book_id = book.json()["id"]

    upload = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/asset",
        files={"file": ("reader.pdf", SAMPLE_PDF_BYTES, "application/pdf")},
        headers=owner_headers,
    )
    assert upload.status_code == 201

    bookmark = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/bookmarks",
        json={"page_number": 12},
        headers=owner_headers,
    )
    assert bookmark.status_code == 201
    assert bookmark.json()["page_number"] == 12

    duplicate_bookmark = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/bookmarks",
        json={"page_number": 12},
        headers=owner_headers,
    )
    assert duplicate_bookmark.status_code == 409

    note = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/notes",
        json={
            "page_number": 12,
            "selected_text": "A useful passage",
            "note_text": "Review this point tomorrow.",
            "position_data": {"x": 12, "y": 48},
        },
        headers=owner_headers,
    )
    assert note.status_code == 201
    note_id = note.json()["id"]

    updated_note = await client.patch(
        f"/api/v1/groups/{group_id}/books/{book_id}/notes/{note_id}",
        json={"note_text": "Reviewed and understood."},
        headers=owner_headers,
    )
    assert updated_note.status_code == 200
    assert updated_note.json()["note_text"] == "Reviewed and understood."

    highlight = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/highlights",
        json={
            "page_number": 13,
            "selected_text": "Keep this highlighted.",
            "color": "yellow",
            "position_data": {"x": 10, "y": 20, "width": 30, "height": 8},
        },
        headers=owner_headers,
    )
    assert highlight.status_code == 201
    highlight_id = highlight.json()["id"]

    annotations = await client.get(
        f"/api/v1/groups/{group_id}/books/{book_id}/annotations",
        headers=owner_headers,
    )
    assert annotations.status_code == 200
    assert len(annotations.json()["bookmarks"]) == 1
    assert len(annotations.json()["notes"]) == 1
    assert len(annotations.json()["highlights"]) == 1

    denied = await client.get(
        f"/api/v1/groups/{group_id}/books/{book_id}/annotations",
        headers=outsider_headers,
    )
    assert denied.status_code == 403

    remove_highlight = await client.delete(
        f"/api/v1/groups/{group_id}/books/{book_id}/highlights/{highlight_id}",
        headers=owner_headers,
    )
    assert remove_highlight.status_code == 204

    remove_note = await client.delete(
        f"/api/v1/groups/{group_id}/books/{book_id}/notes/{note_id}",
        headers=owner_headers,
    )
    assert remove_note.status_code == 204
