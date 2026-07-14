# API and Error Contracts

This contract specifies the payloads and behaviors for the `/api/generate-prompt` endpoint.

---

## 1. Request Contract

**Endpoint**: `POST /api/generate-prompt`  
**Content-Type**: `multipart/form-data`

### 1.1 Parameters

| Parameter | Type | Required | Description | Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `type` | String | Yes | Type of operation. | Must be `"video"`, `"image"`, or `"text"`. |
| `url` | String | No | The YouTube/Shorts URL to analyze. | Must start with valid YouTube domain patterns (e.g. `youtube.com`, `youtu.be`). |
| `file` | Binary | No | The media file upload. | Video: <= 20MB (`video/mp4`, `video/webm`, etc.).<br>Image: <= 10MB (`image/png`, `image/jpeg`, etc.). |
| `text` | String | No | A script or story for storyboard generation. | Required when `type` is `"text"`. |

---

## 2. Response Contract

### 2.1 Success Response (`200 OK`)

Returned when Gemini successfully processes the media/link.

**Content-Type**: `application/json`

```json
{
  "success": true,
  "prompt": "A cinematic panning shot of a green valley at sunrise, mist rising from the river, photo-realistic rendering...",
  "details": {
    "model": "gemini-2.5-flash",
    "detectedType": "video"
  }
}
```

---

## 3. Error Contract

All error states return a consistent JSON payload structure.

**Content-Type**: `application/json`

### 3.1 Error Payload Schema
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "The provided YouTube URL format is invalid.",
    "retryable": false
  }
}
```

### 3.2 Standard Error Codes

| Code | HTTP Status | Retryable | Description |
| :--- | :--- | :--- | :--- |
| `BAD_REQUEST` | `400 Bad Request` | `false` | Missing parameters, invalid type, or malformed URL. |
| `FILE_TOO_LARGE` | `400 Bad Request` | `false` | File size exceeds configured limits. |
| `RATE_LIMIT_EXCEEDED` | `429 Too Many Requests` | `true` | The client has exceeded concurrent usage boundaries. |
| `GEMINI_API_ERROR` | `500 Internal Server Error` | `true` | Underlying failure calling the Google Gemini SDK. |
| `INTERNAL_ERROR` | `500 Internal Server Error` | `false` | Catch-all for unhandled server exceptions. |
