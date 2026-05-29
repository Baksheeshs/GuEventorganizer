from PIL import Image

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    # Get the background color from the top-left pixel
    bg_color = datas[0]
    
    newData = []
    # Tolerance for background color
    tolerance = 20
    
    for item in datas:
        # Check if the pixel color is close to the background color
        if (abs(item[0] - bg_color[0]) < tolerance and 
            abs(item[1] - bg_color[1]) < tolerance and 
            abs(item[2] - bg_color[2]) < tolerance):
            # Replace with transparent
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

remove_background("public/gu-logo-full.png", "public/gu-logo-full.png")
print("Background removed")
