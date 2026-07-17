# LTX-Video API Reference

Complete API documentation for the LTX-Video integration.

---

## 🔌 Backend API (FastAPI)

### Base URL
```
http://localhost:8000
```

---

## 📍 Endpoints

### 1. POST `/generate-video`

Generate video from image and prompt.

#### Request

**Content-Type**: `multipart/form-data`

```bash
curl -X POST http://localhost:8000/generate-video \
  -F "image=@photo.jpg" \
  -F "prompt=A futuristic city at sunset" \
  -F "num_frames=50" \
  -F "guidance_scale=10.0" \
  -F "num_inference_steps=50"
```

#### Parameters

| Name | Type | Required | Default | Range | Description |
|------|------|----------|---------|-------|-------------|
| `image` | File | ✅ | - | - | Input image (JPEG, PNG, WEBP). Max 10MB. |
| `prompt` | String | ✅ | - | 3-1000 chars | Text description for video generation. |
| `num_frames` | Integer | ❌ | 50 | 1-120 | Number of frames to generate. ~30fps. |
| `guidance_scale` | Float | ❌ | 10.0 | 1.0-20.0 | Guidance strength. Higher = more prompt adherence. |
| `num_inference_steps` | Integer | ❌ | 50 | 10-100 | Denoising steps. Higher = better quality but slower. |

#### Response

**Status**: 200 OK

```json
{
  "success": true,
  "message": "Video generated successfully"
}
```

**Body**: Binary video file (MP4)

#### Error Responses

**400 Bad Request** - Invalid input
```json
{
  "success": false,
  "error": "INVALID_PROMPT",
  "detail": "Prompt must be at least 3 characters"
}
```

**507 Insufficient Storage** - GPU out of memory
```json
{
  "success": false,
  "error": "GPU_OUT_OF_MEMORY",
  "detail": "Insufficient GPU memory. Try reducing num_frames or inference_steps."
}
```

**503 Service Unavailable** - Model not loaded
```json
{
  "success": false,
  "error": "SERVICE_NOT_READY",
  "detail": "Service not initialized"
}
```

---

### 2. GET `/health`

Check backend health and GPU status.

#### Request

```bash
curl http://localhost:8000/health
```

#### Response

```json
{
  "status": "ok",
  "service": {
    "device": "cuda",
    "device_name": "NVIDIA RTX 5070",
    "total_vram": 12.0,
    "allocated_vram": 2.5,
    "reserved_vram": 3.0,
    "pipeline_loaded": true,
    "model": "Lightricks/LTX-Video-0.9.8-7B"
  }
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `device` | string | Computing device (cuda/cpu/mps) |
| `device_name` | string | GPU model name |
| `total_vram` | float | Total GPU memory in GB |
| `allocated_vram` | float | Currently allocated memory in GB |
| `reserved_vram` | float | Reserved memory in GB |
| `pipeline_loaded` | boolean | Whether model is loaded in memory |
| `model` | string | Model name/path |

---

### 3. GET `/status`

Get detailed service status.

#### Request

```bash
curl http://localhost:8000/status
```

#### Response

Same as `/health` endpoint.

---

## 🌐 Frontend API (Next.js)

### Base URL
```
http://localhost:3000/api
```

---

### POST `/ltx-video`

Frontend wrapper for backend generation.

#### Request

**Content-Type**: `multipart/form-data`

```javascript
const formData = new FormData();
formData.append("file", imageFile);
formData.append("prompt", "Your video description");
formData.append("num_frames", 50);
formData.append("guidance_scale", 10.0);
formData.append("num_inference_steps", 50);

const response = await fetch("/api/ltx-video", {
  method: "POST",
  body: formData,
});
```

#### Parameters

Same as backend API.

#### Response

**Status**: 200 OK

```json
{
  "success": true,
  "message": "Video generated successfully",
  "video_base64": "AAAA/LZ4hpomAAMAIAAAApWQARR..."
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "error": "INVALID_PROMPT",
  "message": "Prompt must be at least 3 characters"
}
```

**503 Service Unavailable**
```json
{
  "success": false,
  "error": "BACKEND_UNAVAILABLE",
  "message": "Video generation backend is not running. Start it with: python -m uvicorn ltx_video_api:app"
}
```

**504 Gateway Timeout**
```json
{
  "success": false,
  "error": "TIMEOUT",
  "message": "Video generation timed out. The model might be too large for your GPU."
}
```

---

### GET `/ltx-video/status`

Check backend status from frontend.

#### Request

```javascript
const response = await fetch("/api/ltx-video/status");
const data = await response.json();
```

#### Response

```json
{
  "success": true,
  "backend_status": {
    "status": "ok",
    "service": { ... }
  }
}
```

---

## 📊 Error Codes

| Code | Status | Description | Solution |
|------|--------|-------------|----------|
| `MISSING_FIELDS` | 400 | Required fields missing | Check image and prompt |
| `FILE_TOO_LARGE` | 400 | Image > 10MB | Use smaller image |
| `INVALID_PROMPT` | 400 | Prompt < 3 chars | Provide longer prompt |
| `BACKEND_UNAVAILABLE` | 503 | Backend not running | Start backend service |
| `TIMEOUT` | 504 | Generation timeout | Reduce num_frames/steps |
| `GPU_OUT_OF_MEMORY` | 507 | VRAM exceeded | Reduce resolution/frames |
| `INTERNAL_ERROR` | 500 | Unexpected error | Check logs |

---

## 🧪 Testing

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Generate video
curl -X POST http://localhost:8000/generate-video \
  -F "image=@test.jpg" \
  -F "prompt=A beautiful sunset" \
  --output video.mp4

# Check status
curl http://localhost:8000/status
```

### Using Python

```python
import requests

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Generate video
with open("test.jpg", "rb") as f:
    files = {"image": f}
    data = {
        "prompt": "A beautiful sunset",
        "num_frames": 50,
        "guidance_scale": 10.0,
        "num_inference_steps": 50,
    }
    response = requests.post(
        "http://localhost:8000/generate-video",
        files=files,
        data=data,
    )
    
    # Save video
    with open("output.mp4", "wb") as out:
        out.write(response.content)
```

### Using JavaScript

```javascript
// Check status
const statusResponse = await fetch("/api/ltx-video/status");
const statusData = await statusResponse.json();
console.log(statusData);

// Generate video
const formData = new FormData();
formData.append("file", imageFile);
formData.append("prompt", "A beautiful sunset");
formData.append("num_frames", 50);

const response = await fetch("/api/ltx-video", {
  method: "POST",
  body: formData,
});

const data = await response.json();
if (data.success) {
  // Convert base64 to blob
  const binaryString = atob(data.video_base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "video/mp4" });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "video.mp4";
  a.click();
}
```

---

## ⏱️ Latency Expectations

### First Request (Model Loading)
- Model download: 5-10 minutes
- CUDA compilation: 2-3 minutes
- Generation: 30-40 seconds
- **Total: ~50 minutes**

### Subsequent Requests
- Generation: 20-30 seconds
- Model already loaded in memory

### By Configuration

| Config | Time | Notes |
|--------|------|-------|
| 30 frames, 30 steps | 10-15s | Fast testing |
| 50 frames, 50 steps | 20-30s | Balanced |
| 100 frames, 100 steps | 40-60s | High quality |

---

## 🔒 Rate Limiting

Currently **no rate limiting** in place. Recommendations for production:

```python
# Add to backend
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/generate-video")
@limiter.limit("5/minute")
async def generate_video(...):
    ...
```

---

## 📋 Best Practices

1. **Image Quality**: Use high-resolution images (1024x1024+)
2. **Prompt Details**: Be specific and descriptive
3. **Guidance Scale**: 8-12 works well, higher = more prompt adherence
4. **Num Steps**: 50 is good balance, 30 for speed, 100 for quality
5. **Frames**: 50 (~1.7s) is good default
6. **Error Handling**: Always check `success` flag and handle errors gracefully
7. **Streaming**: For large videos, consider streaming response

---

## 🚀 Advanced Usage

### Custom Model

```python
config = LTXVideoConfig(
    model_name="Lightricks/LTX-Video-0.9.8-13B",  # Larger model
    num_inference_steps=100,
)
service = LTXVideoService(config)
```

### Memory Optimization

```python
config = LTXVideoConfig(
    enable_cpu_offload=True,
    enable_vae_tiling=True,
    enable_attention_slicing=True,
    dtype=torch.float16,  # Use fp16
)
```

### Batch Processing

```python
# Generate multiple videos
for image_path in image_paths:
    video = service.generate(
        image=image_path,
        prompt=prompts[image_path],
    )
    service.save_video(video, f"output_{image_path}.mp4")
```

---

## 📞 Support

For issues:
1. Check `/health` endpoint
2. Review GPU memory with `nvidia-smi`
3. Enable debug logging
4. Check backend and frontend logs
