import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_translate_batch_english_identity():
    response = client.post(
        "/api/v1/translate/batch",
        json={
            "texts": ["Hello world", "Welcome to Decode-SIH"],
            "target_lang": "en",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["target_lang"] == "en"
    assert data["translations"]["Hello world"] == "Hello world"
    assert data["translations"]["Welcome to Decode-SIH"] == "Welcome to Decode-SIH"


def test_translate_batch_empty_texts():
    response = client.post(
        "/api/v1/translate/batch",
        json={
            "texts": [],
            "target_lang": "ta",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["translations"] == {}
