"""
FastAPI route for LTX-Video generation
Use this if you want to run a separate Python backend service
"""

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, BackgroundTasks
from starlette.background import BackgroundTask
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
import logging
import io
import asyncio
import tempfile
from PIL import Image
from pathlib import Path
import uvicorn

from ltx_video_service import LTXVideoService, LTXVideoConfig

app = FastAPI(title="LTX-Video API", version="1.0.0")
logger = logging.getLogger(__name__)

# Initialize service globally (will load model on first request)
service: LTXVideoService = None


@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    global service
    config = LTXVideoConfig(
        num_frames=50,
        height=512,
        width=768,
        num_inference_steps=50,
    )
    service = LTXVideoService(config)
    logger.info("LTX-Video service initialized")


@app.get("/health")
async def health():
    """Health check endpoint"""
    if service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    status = service.get_status()
    return {
        "status": "ok",
        "service": status
    }


@app.post("/generate-video")
async def generate_video(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    num_frames: int = Form(default=50),
    guidance_scale: float = Form(default=10.0),
    num_inference_steps: int = Form(default=50),
):
    """
    Generate video from image and prompt.
    
    Args:
        image: Input image file (JPEG, PNG, WEBP)
        prompt: Text description for video generation
        num_frames: Number of frames to generate (default: 50)
        guidance_scale: Guidance scale for generation (default: 10.0)
        num_inference_steps: Number of inference steps (default: 50)
        
    Returns:
        MP4 video file
    """
    if service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    # Validate inputs
    if not prompt or len(prompt.strip()) < 3:
        raise HTTPException(status_code=400, detail="Prompt must be at least 3 characters")
    
    if num_frames < 1 or num_frames > 120:
        raise HTTPException(status_code=400, detail="num_frames must be between 1 and 120")
    
    if guidance_scale < 1.0 or guidance_scale > 20.0:
        raise HTTPException(status_code=400, detail="guidance_scale must be between 1.0 and 20.0")
    
    if num_inference_steps < 10 or num_inference_steps > 100:
        raise HTTPException(status_code=400, detail="num_inference_steps must be between 10 and 100")
    
    try:
        # Read image file
        image_data = await image.read()
        image_bytes = io.BytesIO(image_data)
        image_pil = Image.open(image_bytes).convert("RGB")

        logger.info(f"Received image: {image.filename} ({len(image_data) / (1024**2):.2f} MB)")
        logger.info(f"Prompt: {prompt[:100]}...")

        # Generate video
        logger.info("Starting video generation...")
        video = service.generate(
            image=image_pil,
            prompt=prompt,
            num_frames=num_frames,
            guidance_scale=guidance_scale,
            num_inference_steps=num_inference_steps,
        )
        
        # Save to a PERSISTENT temp file. Must NOT use TemporaryDirectory():
        # FileResponse streams the bytes AFTER this handler returns, by which
        # point a context-managed temp dir would already be deleted.
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        output_path = Path(tmp.name)
        tmp.close()
        service.save_video(video, output_path)

        # Return as file (delete it once the response has been streamed)
        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename="generated_video.mp4",
            headers={"Content-Disposition": "attachment; filename=generated_video.mp4"},
            background=BackgroundTask(lambda: Path(output_path).unlink(missing_ok=True)),
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        if "out of memory" in str(e).lower():
            raise HTTPException(
                status_code=507,
                detail="Insufficient GPU memory. Try reducing num_frames or inference_steps."
            )
        raise HTTPException(status_code=500, detail=f"Generation error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    finally:
        # Clean up GPU memory
        service.clear_memory()


@app.post("/generate-video-stream")
async def generate_video_stream(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    num_frames: int = Form(default=50),
    guidance_scale: float = Form(default=10.0),
    num_inference_steps: int = Form(default=50),
):
    """
    Generate video with streaming response (for monitoring progress).
    Note: This is similar to /generate-video but could be extended for real-time progress updates.
    """
    # For now, same as regular endpoint
    # Could be extended to stream progress events in future
    return await generate_video(image, prompt, num_frames, guidance_scale, num_inference_steps)


@app.get("/status")
async def get_status():
    """Get current service status and GPU info"""
    if service is None:
        raise HTTPException(status_code=503, detail="Service not initialized")
    
    return service.get_status()


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "Internal server error", "status_code": 500},
    )


# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)


if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
