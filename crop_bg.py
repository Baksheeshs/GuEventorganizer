from PIL import Image

def crop_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # Get the bounding box of non-transparent pixels
    bbox = img.getbbox()
    
    if bbox:
        # Crop the image to the bounding box
        img = img.crop(bbox)
        img.save(output_path, "PNG")
        print(f"Cropped to {bbox}")
    else:
        print("No bounding box found (image might be completely transparent)")

crop_transparent("public/gu-logo-full.png", "public/gu-logo-full.png")
