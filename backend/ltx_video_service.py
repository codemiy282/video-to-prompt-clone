"""
LTX-Video Service Wrapper
Handles image-to-video generation with memory optimization for RTX 5070
"""

import torch
import logging
from typing import Optional, Tuple, Union
from pathlib import Path
from dataclasses import dataclass
from PIL import Image
import numpy as np
from diffusers.utils import logging as diffusers_logging

# Suppress diffusers warnings
diffusers_logging.set_verbosity_error()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


@dataclass
class LTXVideoConfig:
    """Configuration for LTX-Video generation"""
    model_name: str = "Lightricks/LTX-Video"
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    dtype: torch.dtype = torch.bfloat16  # diffusers recommends bf16 for LTX
    
    # Generation parameters
    height: int = 512
    width: int = 768
    num_frames: int = 50  # ~1.7 seconds at 30fps
    fps: int = 30
    guidance_scale: float = 10.0
    num_inference_steps: int = 50
    
    # Memory optimization
    enable_cpu_offload: bool = True
    enable_vae_tiling: bool = True
    enable_attention_slicing: bool = False
    use_cache: bool = True
    
    # Model caching
    cache_dir: Optional[Path] = None
    
    def __post_init__(self):
        if self.cache_dir:
            self.cache_dir = Path(self.cache_dir)
            self.cache_dir.mkdir(parents=True, exist_ok=True)


class LTXVideoService:
    """
    Service for generating videos from images using LTX-Video model.
    
    Optimized for RTX 5070 (12GB VRAM) with memory management.
    """
    
    def __init__(self, config: Optional[LTXVideoConfig] = None):
        """
        Initialize LTX-Video service.
        
        Args:
            config: LTXVideoConfig instance. Uses defaults if None.
        """
        self.config = config or LTXVideoConfig()
        self.pipeline = None
        self.device_info = self._get_device_info()
        
        logger.info(f"LTX-Video Service initialized")
        logger.info(f"Device: {self.config.device} ({self.device_info['name']})")
        logger.info(f"VRAM available: {self.device_info['total_vram']:.2f} GB")
        
    def _get_device_info(self) -> dict:
        """Get device information"""
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            total_vram = torch.cuda.get_device_properties(0).total_memory / (1024**3)
            return {
                "name": device_name,
                "total_vram": total_vram,
                "available": True
            }
        else:
            return {
                "name": "CPU",
                "total_vram": 0,
                "available": False
            }
    
    def _load_pipeline(self) -> None:
        """Load the LTX-Video pipeline lazily (diffusers integration)"""
        if self.pipeline is not None:
            return

        logger.info(f"Loading {self.config.model_name} via diffusers...")

        try:
            from diffusers import LTXImageToVideoPipeline
        except ImportError as e:
            raise RuntimeError(
                f"diffusers not installed or import failed. Run: pip install -U diffusers\n{e}"
            )

        self.pipeline = LTXImageToVideoPipeline.from_pretrained(
            self.config.model_name,
            torch_dtype=self.config.dtype,
        )

        # Memory optimizations
        if self.config.device == "cuda":
            if self.config.enable_cpu_offload:
                # Requires the `accelerate` package.
                logger.info("Enabling CPU offload for transformer (requires `accelerate`)...")
                self.pipeline.enable_model_cpu_offload()
            else:
                logger.info(f"Moving pipeline to {self.config.device}...")
                self.pipeline.to(self.config.device)

        if self.config.enable_attention_slicing:
            logger.info("Enabling attention slicing...")
            self.pipeline.enable_attention_slicing()

        if self.config.enable_vae_tiling:
            logger.info("Enabling VAE tiling...")
            self.pipeline.vae.enable_tiling()

        logger.info("Pipeline loaded successfully")
    
    def _preprocess_image(
        self,
        image: Union[str, Path, Image.Image],
    ) -> Image.Image:
        """
        Preprocess input image to expected format.
        
        Args:
            image: Path to image file or PIL Image
            
        Returns:
            PIL Image resized to (height, width)
        """
        if isinstance(image, (str, Path)):
            img = Image.open(image).convert("RGB")
        elif isinstance(image, Image.Image):
            img = image.convert("RGB")
        else:
            raise TypeError(f"Expected str/Path/PIL.Image, got {type(image)}")
        
        # Resize to target dimensions
        img = img.resize((self.config.width, self.config.height), Image.LANCZOS)
        
        logger.debug(f"Image preprocessed: {img.size}")
        return img
    
    def generate(
        self,
        image: Union[str, Path, Image.Image],
        prompt: str,
        num_frames: Optional[int] = None,
        guidance_scale: Optional[float] = None,
        num_inference_steps: Optional[int] = None,
        seed: Optional[int] = None,
    ) -> np.ndarray:
        """
        Generate video from image and prompt.
        
        Args:
            image: Input image (path or PIL Image)
            prompt: Text description for video generation
            num_frames: Number of frames. Defaults to config value.
            guidance_scale: Guidance scale for generation. Defaults to config value.
            num_inference_steps: Number of inference steps. Defaults to config value.
            seed: Random seed for reproducibility
            
        Returns:
            Video as numpy array (T, H, W, C) with values in [0, 1]
        """
        # Load pipeline if needed
        self._load_pipeline()
        
        # Use config values as defaults
        num_frames = num_frames or self.config.num_frames
        guidance_scale = guidance_scale or self.config.guidance_scale
        num_inference_steps = num_inference_steps or self.config.num_inference_steps
        
        # Validate inputs
        if not prompt or len(prompt.strip()) < 3:
            raise ValueError("Prompt must be at least 3 characters")
        
        # Preprocess image
        logger.info(f"Processing image...")
        image = self._preprocess_image(image)
        
        # Set seed for reproducibility
        if seed is not None:
            torch.manual_seed(seed)
            if torch.cuda.is_available():
                torch.cuda.manual_seed(seed)
        
        # Generate video
        logger.info(f"Generating video from image...")
        logger.info(f"  Prompt: {prompt[:100]}...")
        logger.info(f"  Frames: {num_frames}, Resolution: {self.config.height}x{self.config.width}")
        logger.info(f"  Steps: {num_inference_steps}, Guidance: {guidance_scale}")
        
        try:
            with torch.no_grad():
                result = self.pipeline(
                    prompt=prompt,
                    image=image,
                    height=self.config.height,
                    width=self.config.width,
                    num_frames=num_frames,
                    num_inference_steps=num_inference_steps,
                    guidance_scale=guidance_scale,
                )
            
            # Normalize output into a (T, H, W, C) numpy array.
            # diffusers returns `frames` as a list of batch items; each item is
            # either a tensor, a numpy array, or a list of PIL images / arrays.
            video = result.frames[0]
            if isinstance(video, torch.Tensor):
                video = video.cpu().numpy()
            elif isinstance(video, (list, tuple)):
                video = np.stack([np.asarray(f) for f in video], axis=0)

            if not isinstance(video, np.ndarray):
                video = np.asarray(video)

            logger.info(f"Video generated successfully: shape {video.shape}, dtype {video.dtype}")
            return video
            
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                raise RuntimeError(
                    f"GPU out of memory. Try reducing:\n"
                    f"  - num_frames (currently {num_frames})\n"
                    f"  - height/width (currently {self.config.height}x{self.config.width})\n"
                    f"  - num_inference_steps (currently {num_inference_steps})\n"
                    f"Or enable: enable_cpu_offload=True"
                )
            raise
    
    def save_video(
        self,
        video: np.ndarray,
        output_path: Union[str, Path],
        fps: Optional[int] = None,
    ) -> Path:
        """
        Save generated video to file.
        
        Args:
            video: Video array (T, H, W, C) with values in [0, 1]
            output_path: Path to save video
            fps: Frames per second. Defaults to config value.
            
        Returns:
            Path to saved video file
        """
        import imageio
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        fps = fps or self.config.fps
        
        # Convert to uint8 if needed
        if video.dtype == np.float32 or video.dtype == np.float64:
            video = (video * 255).astype(np.uint8)

        logger.info(f"Saving video to {output_path} at {fps} fps...")
        # Write frame-by-frame: imageio.imwrite rejects 4D (T,H,W,C) arrays.
        with imageio.get_writer(output_path, fps=fps) as writer:
            for frame in video:
                writer.append_data(frame)

        file_size = output_path.stat().st_size / (1024**2)
        logger.info(f"Video saved: {file_size:.2f} MB")
        
        return output_path
    
    def clear_memory(self) -> None:
        """Clear GPU memory"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info("GPU memory cleared")
    
    def get_status(self) -> dict:
        """Get service status"""
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated(0) / (1024**3)
            reserved = torch.cuda.memory_reserved(0) / (1024**3)
        else:
            allocated = reserved = 0.0
        
        return {
            "device": self.config.device,
            "device_name": self.device_info["name"],
            "total_vram": self.device_info["total_vram"],
            "allocated_vram": allocated,
            "reserved_vram": reserved,
            "pipeline_loaded": self.pipeline is not None,
            "model": self.config.model_name,
        }


# Singleton instance for Flask/FastAPI integration
_service_instance: Optional[LTXVideoService] = None


def get_ltx_service(config: Optional[LTXVideoConfig] = None) -> LTXVideoService:
    """
    Get or create LTX-Video service singleton.
    
    Args:
        config: Configuration. Ignored if service already exists.
        
    Returns:
        LTXVideoService instance
    """
    global _service_instance
    
    if _service_instance is None:
        _service_instance = LTXVideoService(config)
    
    return _service_instance


# Example usage
if __name__ == "__main__":
    # Initialize service
    config = LTXVideoConfig(
        num_frames=50,
        height=512,
        width=768,
        num_inference_steps=50,
    )
    service = LTXVideoService(config)
    
    # Example: Generate video from image
    try:
        # You would provide an actual image path
        image_path = "example_image.jpg"
        prompt = "A cinematic shot of a futuristic city at sunset with neon lights"
        
        video = service.generate(
            image=image_path,
            prompt=prompt,
        )
        
        # Save video
        output_path = service.save_video(video, "output_video.mp4")
        print(f"Video saved to {output_path}")
        
        # Print status
        status = service.get_status()
        print(f"Status: {status}")
        
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        service.clear_memory()
