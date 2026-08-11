import pytest
import io
from httpx import AsyncClient

SAMPLE_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kinds [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n"


@pytest.mark.asyncio
async def test_shared_reader_full_flow(client: AsyncClient):
    # 1. Register Member A (Owner) and Member B
    reg_a = await client.post("/api/v1/auth/register", json={
        "name": "Member A", "email": "reader_a@example.com", "password": "password123"
    })
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    reg_b = await client.post("/api/v1/auth/register", json={
        "name": "Member B", "email": "reader_b@example.com", "password": "password123"
    })
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Register Outsider User C
    reg_c = await client.post("/api/v1/auth/register", json={
        "name": "Outsider C", "email": "reader_c@example.com", "password": "password123"
    })
    headers_c = {"Authorization": f"Bearer {reg_c.json()['access_token']}"}

    # Create Group as Member A
    group_res = await client.post("/api/v1/groups", json={"name": "Shared Reader Club"}, headers=headers_a)
    assert group_res.status_code == 201
    group_data = group_res.json()
    group_id = group_data["id"]
    invite_code = group_data["invite_code"]

    # Member B joins Group
    join_res = await client.post("/api/v1/groups/join", json={"invite_code": invite_code}, headers=headers_b)
    assert join_res.status_code == 200

    # Create Book in Catalog
    book_res = await client.post("/api/v1/books", json={
        "title": "Clean Code PDF", "author": "Robert C. Martin", "total_pages": 464
    }, headers=headers_a)
    assert book_res.status_code == 201
    book_id = book_res.json()["id"]

    # 2. Test Invalid Uploads
    # Non-PDF extension / signature
    invalid_txt = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/asset",
        files={"file": ("test.txt", b"Hello World", "text/plain")},
        headers=headers_a
    )
    assert invalid_txt.status_code in (400, 415, 422)

    # Fake PDF extension with non-PDF content
    fake_pdf = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/asset",
        files={"file": ("fake.pdf", b"NOT A REAL PDF", "application/pdf")},
        headers=headers_a
    )
    assert fake_pdf.status_code == 422

    # Outsider upload
    outsider_upload = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/asset",
        files={"file": ("book.pdf", SAMPLE_PDF_BYTES, "application/pdf")},
        headers=headers_c
    )
    assert outsider_upload.status_code == 403

    # 3. Valid Upload by Member A
    upload_res = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/asset",
        files={"file": ("clean_code.pdf", SAMPLE_PDF_BYTES, "application/pdf")},
        headers=headers_a
    )
    assert upload_res.status_code == 201
    asset_data = upload_res.json()
    assert asset_data["original_filename"] == "clean_code.pdf"
    assert asset_data["mime_type"] == "application/pdf"

    # 4. Fetch Asset Metadata (Member B)
    meta_res = await client.get(f"/api/v1/groups/{group_id}/books/{book_id}/asset", headers=headers_b)
    assert meta_res.status_code == 200
    meta_json = meta_res.json()
    assert meta_json["has_asset"] is True
    assert meta_json["asset"]["id"] == asset_data["id"]
    assert meta_json["progress"] is None

    # Outsider cannot get asset
    meta_outsider = await client.get(f"/api/v1/groups/{group_id}/books/{book_id}/asset", headers=headers_c)
    assert meta_outsider.status_code == 403

    # 5. Get Reader URL (Member B)
    url_res = await client.get(f"/api/v1/groups/{group_id}/books/{book_id}/reader-url", headers=headers_b)
    assert url_res.status_code == 200
    url_json = url_res.json()
    assert "url" in url_json
    assert url_json["expires_in_seconds"] == 900

    # 6. Save Reading Progress (Member B reads to page 42)
    prog_put = await client.put(
        f"/api/v1/groups/{group_id}/books/{book_id}/progress",
        json={"current_page": 42, "total_pages": 464},
        headers=headers_b
    )
    assert prog_put.status_code == 200
    prog_data = prog_put.json()
    assert prog_data["current_page"] == 42
    assert prog_data["total_pages"] == 464
    assert prog_data["progress_percent"] == 9.05

    # Retrieve Progress (Member B)
    prog_get = await client.get(f"/api/v1/groups/{group_id}/books/{book_id}/progress", headers=headers_b)
    assert prog_get.status_code == 200
    assert prog_get.json()["current_page"] == 42

    # 7. Member B replaces the shared PDF with an updated edition
    NEW_PDF_BYTES = SAMPLE_PDF_BYTES + b"% updated v2"
    replace_res = await client.post(
        f"/api/v1/groups/{group_id}/books/{book_id}/asset",
        files={"file": ("clean_code_v2.pdf", NEW_PDF_BYTES, "application/pdf")},
        headers=headers_b
    )
    assert replace_res.status_code == 201
    assert replace_res.json()["original_filename"] == "clean_code_v2.pdf"

    # Verify prior reading progress was reset on file replacement
    prog_after_replace = await client.get(
        f"/api/v1/groups/{group_id}/books/{book_id}/progress",
        headers=headers_b
    )
    assert prog_after_replace.status_code == 404

    # 8. Delete Shared Asset (Member A)
    del_res = await client.delete(f"/api/v1/groups/{group_id}/books/{book_id}/asset", headers=headers_a)
    assert del_res.status_code == 200

    # Verify asset is gone
    meta_after_del = await client.get(f"/api/v1/groups/{group_id}/books/{book_id}/asset", headers=headers_b)
    assert meta_after_del.status_code == 200
    assert meta_after_del.json()["has_asset"] is False
