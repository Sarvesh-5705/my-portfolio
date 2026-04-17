import os
import glob
try:
    from PIL import Image, ImageFilter
except ImportError:
    print("Pillow not installed. Attempting to install...")
    os.system('pip install Pillow')
    from PIL import Image, ImageFilter

public_dir = os.path.join(os.path.dirname(__file__), 'public')
pattern = os.path.join(public_dir, 'ezgif-frame-*.jpg')
files = glob.glob(pattern)

if not files:
    print("No frame files found in public/")
else:
    print(f"Found {len(files)} frames. Upscaling by 2x and sharpening...")
    for idx, file in enumerate(files):
        with Image.open(file) as img:
            # 2x upscale using high quality Lanczos
            new_size = (img.width * 2, img.height * 2)
            upscaled = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Apply unsharp mask to crisp up edges
            sharpened = upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
            
            # Overwrite original
            sharpened.save(file, quality=95)
        
        if (idx + 1) % 50 == 0:
            print(f"Processed {idx + 1}/{len(files)} frames...")
            
    print("Done upscaling and sharpening all frames!")
