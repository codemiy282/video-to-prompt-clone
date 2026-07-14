# System Blueprint: Video to Prompt

This document defines the high-level system layout, boundaries, technology requirements, and security configurations for the Video to Prompt project.

---

## 1. System Boundaries & Actors

The system operates as a single-tenant Next.js application.

```
+-----------------------------------------------------------+
|                        Next.js UI                         |
|  - Drag & Drop Dropzone                                   |
|  - YouTube Link Text Bar                                  |
|  - State: loading, progress, result display, copy prompt  |
+-----------------------------+-----------------------------+
                              | (HTTPS POST /api/generate-prompt)
                              v
+-----------------------------+-----------------------------+
|                     Next.js API Route                     |
|  - Handles Multipart Form parsing                         |
|  - Exposes validation bounds                              |
|  - Authenticates securely with env.GEMINI_API_KEY          |
+----------------------+----------------------+-------------+
                       |                      |
      (File Streams)   v                      v (Subtitles / Context Metadata)
+----------------------+--+        +----------+-------------+
|   Gemini File API       |        |   YouTube Scraper/API  |
|  - Temporary storage    |        |  - Extract key terms   |
|  - Automatic GC         |        |  - Subtitle parser     |
+----------------------+--+        +----------+-------------+
                       |                      |
                       v                      v
+----------------------+----------------------+-------------+
|                   Google Gemini AI Model                  |
|  - Model: gemini-2.5-flash                                |
|  - Goal: Synthesize highly descriptive video prompt       |
+-----------------------------------------------------------+
```

---

## 2. Component Specifications

### 2.1 API Route Component (`src/app/api/generate-prompt`)
- **Responsibility**: Gatekeeper for all incoming analysis requests.
- **Protocol**: HTTP/1.1 or HTTP/2 POST.
- **Inputs**:
  - Binary stream (File upload) up to 20MB.
  - String (YouTube URL).
- **Constraints**:
  - Memory limit: 256MB execution environment.
  - Execution timeout: 60s max.

### 2.2 Gemini Connector (`src/lib/gemini`)
- **Responsibility**: Direct integration with Google Gen AI SDK.
- **Methods**:
  - `uploadFile()`: Sends stream directly to Gemini File API.
  - `generateContent()`: Requests analysis prompt with configured system guidelines.

### 2.3 YouTube Extractor (`src/lib/youtube`)
- **Responsibility**: Resolve Shorts and URLs.
- **Fallbacks**: If subtitles/data retrieval fails, fall back to analyzing visual descriptors extracted from the public thumbnail or title metadata.

---

## 3. Observability & Error Model

All system responses must adhere to uniform specifications:
- **Error Codes**:
  - `BAD_REQUEST`: Invalid URL format or file type.
  - `FILE_TOO_LARGE`: Upload exceeds configured boundaries.
  - `GEMINI_API_ERROR`: Underlying Google SDK failure.
  - `RATE_LIMIT_EXCEEDED`: Exceeded max concurrent requests.
