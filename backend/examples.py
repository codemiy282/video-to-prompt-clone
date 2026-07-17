"""
Example: Using LTX-Video Service Directly
Demonstrates how to use the LTX-Video wrapper without FastAPI
"""

import torch
from pathlib import Path
from ltx_video_service import LTXVideoService, LTXVideoConfig


def example_basic():
    """Basic example: Generate video from image and prompt"""
    print("=" * 60)
    print("LTX-Video Basic Example")
    print("=" * 60)
    
    # 1. Configure
    config = LTXVideoConfig(
        num_frames=50,           # ~1.7 seconds at 30fps
        height=512,
        width=768,
        num_inference_steps=50,
        guidance_scale=10.0,
        enable_cpu_offload=True,
        enable_vae_tiling=True,
    )
    
    # 2. Initialize service
    print("\n[1/5] Initializing service...")
    service = LTXVideoService(config)
    
    # 3. Check status
    print("\n[2/5] Checking GPU status...")
    status = service.get_status()
    print(f"  Device: {status['device_name']}")
    print(f"  Total VRAM: {status['total_vram']:.1f} GB")
    
    # 4. Generate (first time loads model - slow!)
    print("\n[3/5] Loading model (first time takes ~10 minutes)...")
    print("  Generating video from image...")
    
    try:
        # Example image path - you would provide your actual image
        image_path = "example_image.jpg"
        prompt = "A futuristic cyberpunk city at sunset with neon lights, wet streets reflecting the colors, flying cars in the sky, cinematic lighting"
        
        # Generate video
        video = service.generate(
            image=image_path,
            prompt=prompt,
            num_frames=50,
            guidance_scale=10.0,
            num_inference_steps=50,
        )
        
        # 5. Save result
        print("\n[4/5] Saving video...")
        output_path = service.save_video(video, "output_video.mp4")
        print(f"  ✓ Saved to: {output_path}")
        
        # 6. Final status
        print("\n[5/5] Final status...")
        final_status = service.get_status()
        print(f"  Allocated VRAM: {final_status['allocated_vram']:.1f} GB")
        print(f"  Reserved VRAM: {final_status['reserved_vram']:.1f} GB")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        # Clean up GPU memory
        print("\nCleaning up GPU memory...")
        service.clear_memory()
        print("Done! 🎉")


def example_batch():
    """Batch example: Generate multiple videos efficiently"""
    print("=" * 60)
    print("LTX-Video Batch Processing Example")
    print("=" * 60)
    
    config = LTXVideoConfig(
        num_frames=50,
        height=512,
        width=768,
        num_inference_steps=50,
    )
    
    service = LTXVideoService(config)
    
    # List of images and prompts
    images = [
        ("image1.jpg", "A peaceful mountain landscape at dawn"),
        ("image2.jpg", "A futuristic robot walking through a city"),
        ("image3.jpg", "Ocean waves crashing on a beach"),
    ]
    
    output_dir = Path("batch_outputs")
    output_dir.mkdir(exist_ok=True)
    
    print(f"\nProcessing {len(images)} images...")
    
    for idx, (image_path, prompt) in enumerate(images, 1):
        print(f"\n[{idx}/{len(images)}] Processing {image_path}...")
        
        try:
            video = service.generate(image=image_path, prompt=prompt)
            output_path = service.save_video(
                video,
                output_dir / f"video_{idx}.mp4"
            )
            print(f"  ✓ Generated: {output_path}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    service.clear_memory()
    print(f"\n✓ All videos saved to {output_dir}")


def example_quality_tiers():
    """Example: Different quality/speed tiers"""
    print("=" * 60)
    print("LTX-Video Quality Tiers")
    print("=" * 60)
    
    tiers = {
        "fast": LTXVideoConfig(
            num_frames=30,
            height=384,
            width=576,
            num_inference_steps=30,
            guidance_scale=8.0,
        ),
        "balanced": LTXVideoConfig(
            num_frames=50,
            height=512,
            width=768,
            num_inference_steps=50,
            guidance_scale=10.0,
        ),
        "quality": LTXVideoConfig(
            num_frames=100,
            height=1024,
            width=1536,
            num_inference_steps=100,
            guidance_scale=15.0,
        ),
    }
    
    for tier_name, config in tiers.items():
        print(f"\n{tier_name.upper()} Tier:")
        print(f"  Frames: {config.num_frames} (~{config.num_frames/30:.1f}s)")
        print(f"  Resolution: {config.width}x{config.height}")
        print(f"  Steps: {config.num_inference_steps}")
        print(f"  Guidance: {config.guidance_scale}")


def example_gpu_monitoring():
    """Example: Monitor GPU usage during generation"""
    print("=" * 60)
    print("GPU Memory Monitoring")
    print("=" * 60)
    
    if not torch.cuda.is_available():
        print("❌ CUDA not available")
        return
    
    config = LTXVideoConfig()
    service = LTXVideoService(config)
    
    print("\nBefore loading model:")
    status = service.get_status()
    print(f"  Allocated: {status['allocated_vram']:.2f} GB")
    print(f"  Reserved: {status['reserved_vram']:.2f} GB")
    
    # Load pipeline (first time)
    print("\nLoading model...")
    service._load_pipeline()
    
    print("After loading model:")
    status = service.get_status()
    print(f"  Allocated: {status['allocated_vram']:.2f} GB")
    print(f"  Reserved: {status['reserved_vram']:.2f} GB")
    
    service.clear_memory()
    print("\nAfter cleanup:")
    status = service.get_status()
    print(f"  Allocated: {status['allocated_vram']:.2f} GB")
    print(f"  Reserved: {status['reserved_vram']:.2f} GB")


if __name__ == "__main__":
    import sys
    
    examples = {
        "basic": example_basic,
        "batch": example_batch,
        "tiers": example_quality_tiers,
        "gpu": example_gpu_monitoring,
    }
    
    if len(sys.argv) > 1:
        example_name = sys.argv[1]
        if example_name in examples:
            examples[example_name]()
        else:
            print(f"Unknown example: {example_name}")
            print(f"Available: {', '.join(examples.keys())}")
    else:
        print("LTX-Video Examples")
        print("=" * 60)
        print("\nUsage: python examples.py [example_name]")
        print(f"\nAvailable examples:")
        for name, func in examples.items():
            doc = func.__doc__ or "No description"
            print(f"  - {name}: {doc.strip()}")
        print("\nExample: python examples.py basic")
