# 🚀 LTX-Video Integration Setup Guide

Complete step-by-step guide to integrate LTX-Video into video-to-prompt-clone.

---

## 📋 Prerequisites

### System Requirements
- **GPU**: RTX 5070 (12GB VRAM) ✅ Supported
- **CUDA**: 12.1 or higher
- **Python**: 3.10+
- **Node.js**: 18+

### Verify Your Setup
```bash
# Check GPU
nvidia-smi

# Check CUDA
nvcc --version

# Check Python
python --version

# Check Node
node --version
```

---

## 🏗️ Architecture: Two-Backend Approach

### Option A: Separate Python Backend (Recommended for Local)

```
Frontend (Next.js)
    ↓
Next.js API Route (/api/ltx-video)
    ↓
Python FastAPI Backend
    ↓
LTX-Video + PyTorch + CUDA
```

**Pros**: Easy debugging, isolated Python environment, better performance
**Cons**: Requires running two services

### Option B: Node.js Backend with Python Worker

```
Frontend (Next.js)
    ↓
Next.js API Route
    ↓
Node.js → spawn Python subprocess
    ↓
LTX-Video
```

**Pros**: Single service to manage
**Cons**: More complex, slower startup

---

## 📦 Installation

### Step 1: Clone/Setup Projects

```bash
# Navigate to workspace
cd C:\Users\Admin\.gemini\antigravity-ide\scratch

# Clone video-to-prompt-clone if not exists
git clone <your-repo> video-to-prompt-clone
cd video-to-prompt-clone

# Create Python backend directory
mkdir -p backend
cd backend
```

### Step 2: Create Python Virtual Environment

```bash
# Create venv
python -m venv venv

# Activate
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### Step 3: Install Dependencies

Create `backend/requirements.txt`:
```txt
torch>=2.1.0,<2.2.0
torchvision>=0.16.0
diffusers>=0.28.2
transformers>=4.47.2,<4.52.0
pillow>=10.0.0
opencv-python>=4.8.0
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
pydantic>=2.0.0
aiofiles>=23.2.0
imageio[ffmpeg]>=2.23.0
huggingface-hub>=0.30.0
einops
timm
sentencepiece>=0.1.96
```

Install:
```bash
pip install -r requirements.txt

# Optional: Add ltx-video directly if in development
# pip install -e C:\Users\Admin\copilot-worktrees\LTX-Video\codemiy282-refactored-winner
```

### Step 4: Copy Backend Files

```bash
# Copy wrapper and API
cp <path-to>/ltx_video_service.py .
cp <path-to>/ltx_video_api.py .
```

### Step 5: Configure Environment

Create `backend/.env`:
```bash
# Optional: Speed up model downloads
HF_HOME=/path/to/cache
HF_TOKEN=your_token_if_needed

# Backend config
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=info
```

### Step 6: Test Backend Startup

```bash
python -m uvicorn ltx_video_api:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
INFO:     LTX-Video service initialized
```

⚠️ **First startup takes 5-15 minutes** (model download + CUDA compilation)

### Step 7: Setup Frontend

```bash
# Back to project root
cd ..

# Copy new API route
cp <path-to>/ltx_video_route.ts src/app/api/ltx-video/route.ts

# Copy updated image-to-video page
cp <path-to>/image_to_video_page.tsx src/app/image-to-video/page.tsx
```

### Step 8: Configure Environment

Create `.env.local` in project root:
```bash
# Point to local backend
LTX_VIDEO_BACKEND_URL=http://localhost:8000
```

### Step 9: Install Frontend Dependencies

```bash
npm install
# or
yarn install
```

### Step 10: Start Frontend

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🧪 Testing

### Health Check

```bash
# Test backend
curl http://localhost:8000/health

# Expected response
{
  "status": "ok",
  "service": {
    "device": "cuda",
    "device_name": "NVIDIA RTX 5070",
    "total_vram": 12.0,
    "allocated_vram": 0.0,
    "reserved_vram": 0.0,
    "pipeline_loaded": false,
    "model": "Lightricks/LTX-Video-0.9.8-7B"
  }
}
```

### Generate Test Video

```bash
# Test with curl
curl -X POST http://localhost:8000/generate-video \
  -F "image=@test_image.jpg" \
  -F "prompt=A futuristic city at sunset" \
  -F "num_frames=30" \
  --output test_video.mp4
```

### Full E2E Test

1. Open http://localhost:3000/image-to-video
2. Upload test image
3. Enter prompt
4. Click "Generate Video"
5. Watch for video output

---

## ⚠️ Common Issues & Solutions

### Issue 1: "ModuleNotFoundError: No module named 'ltx_video'"

**Solution**:
```bash
# Make sure ltx-video is installed
pip install ltx-video

# Or install from source
pip install -e C:\Users\Admin\copilot-worktrees\LTX-Video\codemiy282-refactored-winner
```

### Issue 2: "CUDA out of memory"

**Solutions**:
1. Reduce `num_frames` to 30-40
2. Reduce resolution (use 512x768 instead of 1024x1536)
3. Enable CPU offload (already enabled by default)
4. Use smaller model (7B instead of 13B)
5. Close other GPU applications

### Issue 3: "Connection refused" from frontend

**Solution**:
- Make sure backend is running on http://localhost:8000
- Check `.env.local` has correct `LTX_VIDEO_BACKEND_URL`
- Check Windows Firewall allows port 8000

### Issue 4: Very slow first inference

**Cause**: Model downloading and CUDA compilation
**Expected**: 5-15 minutes on first run
**Subsequent runs**: 20-30 seconds

### Issue 5: "RuntimeError: NVIDIA driver not compatible"

**Solution**:
```bash
# Update NVIDIA drivers
# Visit: https://www.nvidia.com/Download/driverDetails.aspx

# Or reinstall CUDA
# Visit: https://developer.nvidia.com/cuda-toolkit
```

---

## 📊 Performance Tuning for RTX 5070

### Optimal Settings for Speed

```python
# Balance between quality and speed (Recommended)
config = LTXVideoConfig(
    num_frames=50,        # ~1.7s video
    height=512,
    width=768,
    num_inference_steps=50,
    guidance_scale=10.0,
    enable_cpu_offload=True,
    enable_vae_tiling=True,
)
```

### Optimal Settings for Quality

```python
# High quality, slower
config = LTXVideoConfig(
    num_frames=100,       # ~3.3s video
    height=1024,
    width=1536,
    num_inference_steps=100,
    guidance_scale=15.0,
    enable_cpu_offload=False,  # If enough VRAM
    enable_vae_tiling=True,
)
```

### Optimal Settings for VRAM Constrained

```python
# Low VRAM usage
config = LTXVideoConfig(
    num_frames=30,        # ~1s video
    height=384,
    width=576,
    num_inference_steps=30,
    guidance_scale=8.0,
    enable_cpu_offload=True,
    enable_vae_tiling=True,
)
```

---

## 🔄 Workflow: Development to Production

### Local Development

```bash
# Terminal 1: Backend
cd backend
venv\Scripts\activate
python -m uvicorn ltx_video_api:app --reload

# Terminal 2: Frontend
cd ..
npm run dev
```

### Testing

```bash
# Run tests
npm run test
# or
pytest backend/

# Check types
npm run lint
```

### Deployment

#### Option 1: Docker

Create `Dockerfile`:
```dockerfile
FROM nvidia/cuda:12.1.1-runtime-ubuntu22.04

WORKDIR /app

# Python deps
RUN apt-get update && apt-get install -y python3.11 python3-pip
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

# Copy backend
COPY backend/ .

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "ltx_video_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t ltx-video-backend .
docker run --gpus all -p 8000:8000 ltx-video-backend
```

#### Option 2: Cloud GPU Services

- **Runpod.io**: ~$0.44/hour for RTX 4090
- **Lambda Labs**: Custom GPU instances
- **Vast.ai**: Community marketplace for GPU

---

## 📈 Monitoring & Logging

### Enable Debug Logging

Backend `.env`:
```bash
LOG_LEVEL=debug
```

### Monitor GPU Usage

```bash
# In separate terminal
watch -n 0.5 nvidia-smi
```

### Monitor Memory

```bash
# Check Python memory usage
pip install memory-profiler
python -m memory_profiler ltx_video_api.py
```

---

## 🎯 Next Steps

1. **Customize Parameters**: Adjust `num_frames`, `guidance_scale`, etc.
2. **Add Models**: Support multiple LTX models (13B, Distilled)
3. **Implement Caching**: Cache models in memory
4. **Add Queue System**: Use Celery for background processing
5. **Deploy to Cloud**: Runpod, Lambda Labs, or self-hosted
6. **Add Monitoring**: Track usage, errors, performance

---

## 📚 Resources

- **LTX-Video Docs**: https://docs.ltx.video
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs
- **Hugging Face**: https://huggingface.co/Lightricks/LTX-Video
- **CUDA Toolkit**: https://developer.nvidia.com/cuda-toolkit

---

## 🆘 Support

If you encounter issues:

1. Check the **Common Issues** section above
2. Enable debug logging
3. Check GPU with `nvidia-smi`
4. Test backend directly: `curl http://localhost:8000/health`
5. Check frontend console for errors
6. Review backend logs

---

## 💡 Tips

- Start with small `num_frames` (30) for testing
- Use `guidance_scale=10.0` as default
- Keep input images high quality (1024x1024+)
- Monitor GPU memory with `nvidia-smi`
- Restart backend if memory grows over time

Good luck! 🚀
