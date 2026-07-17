# 🔧 Troubleshooting Guide

Complete troubleshooting for LTX-Video integration with RTX 5070.

---

## 🚀 Quick Diagnostics

### 1. Check NVIDIA Driver

```bash
nvidia-smi
```

**Expected output**:
- GPU name: NVIDIA RTX 5070
- VRAM: 12 GB
- Driver version: 550+ (recommended)

**If not working**:
```bash
# Update drivers: https://www.nvidia.com/Download/index.aspx
# Or use package manager:
# Ubuntu: sudo apt install nvidia-driver-550
# Windows: Visit NVIDIA website directly
```

### 2. Check CUDA

```bash
nvcc --version
```

**Expected**: CUDA 12.1 or higher

**If not installed**:
- Download: https://developer.nvidia.com/cuda-toolkit
- After installation, restart terminal/IDE

### 3. Check Python Setup

```bash
python --version  # Should be 3.10+
python -c "import torch; print(torch.cuda.is_available())"
```

**Expected**: `True`

**If False**:
```bash
# Reinstall torch with CUDA support
pip uninstall torch -y
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

---

## ❌ Backend Issues

### Issue: "ModuleNotFoundError: No module named 'ltx_video'"

**Cause**: LTX-Video package not installed

**Solutions**:
```bash
# Option 1: Install from pip
pip install ltx-video

# Option 2: Install from source
cd C:\Users\Admin\copilot-worktrees\LTX-Video\codemiy282-refactored-winner
pip install -e .

# Option 3: Add to Python path
export PYTHONPATH="${PYTHONPATH}:C:/Users/Admin/copilot-worktrees/LTX-Video/codemiy282-refactored-winner"
```

### Issue: "RuntimeError: CUDA out of memory"

**Cause**: Not enough GPU VRAM for generation

**Solutions** (try in order):
```python
# 1. Reduce frames
num_frames = 30  # Instead of 50

# 2. Reduce resolution
height, width = 384, 576  # Instead of 512, 768

# 3. Reduce inference steps
num_inference_steps = 30  # Instead of 50

# 4. Enable all optimizations
config = LTXVideoConfig(
    enable_cpu_offload=True,        # Offload to CPU
    enable_vae_tiling=True,         # Tile VAE
    dtype=torch.float16,            # Use FP16 (saves 50% VRAM)
)

# 5. Use smaller model
model_name="Lightricks/LTX-Video-0.9.8-7B"  # 7B instead of 13B
```

**Before generation**, check memory:
```python
import torch
print(f"Available VRAM: {torch.cuda.mem_get_info()[0] / 1e9:.2f} GB")
```

### Issue: "ConnectionError" or "Connection refused"

**Cause**: FastAPI backend not running

**Solution**:
```bash
# Start backend
cd backend
python -m uvicorn ltx_video_api:app --reload --host 0.0.0.0 --port 8000

# Should show:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Application startup complete
```

### Issue: Backend starts but "Application startup complete" never appears

**Cause**: Model downloading (first time takes 5-15 minutes)

**Solution**:
```bash
# Open new terminal
watch -n 1 nvidia-smi  # Monitor GPU

# Check backend logs in original terminal
# Should show: "Loading Lightricks/LTX-Video..."
# Wait for it to complete
```

### Issue: "The model could not be found in the huggingface cache"

**Cause**: First time model download failed or incomplete

**Solutions**:
```bash
# 1. Clear cache and retry
rm -rf ~/.cache/huggingface
python -m uvicorn ltx_video_api:app --reload

# 2. Download manually
from huggingface_hub import snapshot_download
snapshot_download("Lightricks/LTX-Video-0.9.8-7B")

# 3. Check disk space
df -h  # Linux/macOS
# Or use File Explorer (Windows)
# Need: ~20GB free space
```

### Issue: Very slow generation (60+ seconds)

**Cause**: CPU offload in use (check if VRAM full)

**Solution**:
```bash
# Monitor GPU
nvidia-smi

# If VRAM is full (11+ GB), it's using CPU offload:
# - This is normal and expected
# - Quality is same, just slower
# - Allocate more VRAM by:
#   - Reducing num_frames
#   - Using smaller model
#   - Closing other GPU apps
```

---

## ❌ Frontend Issues

### Issue: "Cannot POST /api/ltx-video"

**Cause**: Route not created or mismatch

**Solution**:
```bash
# Verify file exists:
# src/app/api/ltx-video/route.ts

# Check it has correct code (not old image-to-video)
# Restart Next.js: Ctrl+C then `npm run dev`
```

### Issue: "LTX_VIDEO_BACKEND_URL not found"

**Cause**: Environment variable not set

**Solution**:
```bash
# Create .env.local in project root
echo "LTX_VIDEO_BACKEND_URL=http://localhost:8000" > .env.local

# Restart frontend
npm run dev
```

### Issue: "Backend unavailable" message on UI

**Cause**: Backend not running or wrong URL

**Solution**:
```bash
# 1. Check backend is running
curl http://localhost:8000/health

# 2. Check URL in .env.local
cat .env.local

# 3. If using Docker:
docker ps  # Should show ltx-video-backend running

# 4. Check Docker network
docker network inspect ltx-video-network

# 5. Use correct hostname in Docker:
# LTX_VIDEO_BACKEND_URL=http://ltx-video-backend:8000
```

### Issue: Video won't download

**Cause**: CORS issues or video too large

**Solution**:
```bash
# 1. Check video size
# Should be < 100MB for most browsers

# 2. Try right-click → Save video as...

# 3. For large videos, stream from server:
# Modify ltx_video_route.ts to return FileResponse instead of base64
```

---

## 🐳 Docker Issues

### Issue: "Error response from daemon: could not select device driver"

**Cause**: NVIDIA Docker runtime not installed

**Solution**:
```bash
# Install NVIDIA Docker
# Ubuntu:
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt update
sudo apt install nvidia-docker2

# Windows: Use WSL2 with NVIDIA CUDA on WSL
```

### Issue: Docker container out of memory

**Cause**: GPU memory limit

**Solution**:
```yaml
# In docker-compose.yml, remove or increase:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          device_ids: ['0']  # Select specific GPU
          capabilities: [gpu]
```

### Issue: Model cached but still downloading on restart

**Solution**:
```bash
# Use named volume instead of bind mount
# In docker-compose.yml:
volumes:
  - huggingface-cache:/cache/huggingface

# This persists cache between restarts
```

---

## 🧪 Testing & Validation

### Test 1: Backend Health

```bash
curl http://localhost:8000/health
```

**Expected**: Status 200 with GPU info

### Test 2: Generate Test Video

```bash
# Create test image first (or use existing)
curl -X POST http://localhost:8000/generate-video \
  -F "image=@test.jpg" \
  -F "prompt=A beautiful sunset" \
  --output test.mp4

# Check file size
ls -lh test.mp4
```

**Expected**: 50+ MB video file

### Test 3: Frontend Connection

Open browser console (F12):
```javascript
fetch('/api/ltx-video/status').then(r => r.json()).then(console.log)
```

**Expected**: Shows backend status

### Test 4: Full E2E Test

1. Open http://localhost:3000/image-to-video
2. Upload test image
3. Enter prompt: "A test video"
4. Set frames: 30
5. Click "Generate Video"
6. Should see progress indicator
7. Video should appear after 20-30 seconds

---

## 📊 Performance Monitoring

### Real-time GPU Monitoring

```bash
# Linux/macOS
watch -n 0.5 nvidia-smi

# Windows (PowerShell)
while($true) { nvidia-smi; Start-Sleep -Seconds 1; cls }
```

### Monitor Memory Growth

```bash
# Python script
import torch
import time

for i in range(100):
    allocated = torch.cuda.memory_allocated(0) / 1e9
    reserved = torch.cuda.memory_reserved(0) / 1e9
    print(f"{i:3d}: Allocated {allocated:.2f}GB, Reserved {reserved:.2f}GB")
    time.sleep(1)
```

### Check Thermal Status

```bash
# Linux
nvidia-smi -q -d TEMPERATURE

# Watch for throttling
nvidia-smi dmon
```

---

## 🔍 Debug Mode

### Enable Debug Logging

Backend `.env`:
```
LOG_LEVEL=debug
```

Frontend `next.config.ts`:
```typescript
logging: {
  fetches: {
    fullUrl: true,
  },
}
```

### Verbose Torch Output

```python
import logging
logging.getLogger("torch").setLevel(logging.DEBUG)
```

### Check All Versions

```bash
python -c "
import torch
import transformers
import diffusers
print(f'Torch: {torch.__version__}')
print(f'Transformers: {transformers.__version__}')
print(f'Diffusers: {diffusers.__version__}')
print(f'CUDA: {torch.version.cuda}')
print(f'GPU: {torch.cuda.get_device_name(0)}')
"
```

---

## 🆘 Still Having Issues?

### Step 1: Collect Logs

```bash
# Backend logs
python -m uvicorn ltx_video_api:app --log-level debug 2>&1 | tee backend.log

# Frontend logs (browser console)
# F12 → Console tab

# System info
nvidia-smi > gpu.log
torch -c "import torch; print(torch.cuda.get_device_properties(0))" > torch.log
```

### Step 2: Check Disk Space

```bash
# Ensure 30GB free for models
df -h /

# Check cache size
du -sh ~/.cache/huggingface/
```

### Step 3: Nuclear Reset

```bash
# Clear everything and start fresh
# WARNING: This removes all cached models

# Stop services
# Kill backend and frontend

# Clear cache
rm -rf ~/.cache/huggingface/
rm -rf ~/.cache/torch/

# Remove virtual environment
rm -rf backend/venv/

# Reinstall
python -m venv backend/venv
source backend/venv/bin/activate
pip install -r requirements.txt

# Restart
python -m uvicorn ltx_video_api:app --reload
```

---

## 📋 Troubleshooting Checklist

- [ ] NVIDIA driver installed? (`nvidia-smi` works)
- [ ] CUDA 12.1+? (`nvcc --version`)
- [ ] Python 3.10+? (`python --version`)
- [ ] Torch with CUDA? (`torch.cuda.is_available()` = True)
- [ ] LTX-Video installed? (`python -c "import ltx_video"`)
- [ ] Backend starts? (no "Uvicorn running" means model loading)
- [ ] Backend responds? (`curl http://localhost:8000/health`)
- [ ] Frontend starts? (`npm run dev` completes)
- [ ] .env.local exists? (`cat .env.local`)
- [ ] Backend URL correct? (matches .env.local)
- [ ] GPU has 12GB VRAM? (`nvidia-smi`)
- [ ] Disk has 30GB free? (`df -h`)

---

## 🎓 Common Misunderstandings

**"Why is first generation so slow?"**
- Model download (5-10 min) + CUDA compilation (2-3 min) = first time overhead
- Subsequent generations are 20-30 seconds

**"Why is generation still slow even with GPU?"**
- Video generation is inherently expensive (LTX pipeline ~20-30s)
- For faster results, use fewer frames/steps or lower resolution

**"Will increasing guidance_scale make it faster?"**
- No, guidance scale only affects quality, not speed

**"Can I use CPU instead of GPU?"**
- Technically yes, but it will take 10+ minutes per frame
- Not recommended for RTX 5070 owner who has GPU

**"Do I need 24GB VRAM like RTX 4090?"**
- No, 12GB (RTX 5070) is sufficient with optimizations enabled
- 24GB just allows bigger models without offload

---

## 📞 Resources

- LTX-Video Issues: https://github.com/Lightricks/LTX-Video/issues
- NVIDIA Docker: https://github.com/NVIDIA/nvidia-docker
- FastAPI Docs: https://fastapi.tiangolo.com
- Next.js Troubleshooting: https://nextjs.org/docs/pages/building-your-application/testing

Good luck! 🚀
