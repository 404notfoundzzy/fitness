from PIL import Image
import os

src_image_path = r"C:\Users\zzy\Desktop\肌群图标.png"
output_dir = r"d:\softWare\develop\app-myself\fitness\fitness-app\static\icons"

img = Image.open(src_image_path)
img_width, img_height = img.size

print(f"Image size: {img_width}x{img_height}")

icons_info = [
    {"name": "chest", "row": 0, "col": 0, "label": "胸部肌群"},
    {"name": "back", "row": 0, "col": 1, "label": "背部肌群"},
    {"name": "legs", "row": 0, "col": 2, "label": "下肢肌群"},
    {"name": "shoulders", "row": 0, "col": 3, "label": "肩部肌群"},
    {"name": "arms", "row": 1, "col": 0, "label": "手臂肌群"},
    {"name": "core", "row": 1, "col": 1, "label": "核心训练"},
    {"name": "cardio", "row": 1, "col": 2, "label": "全身有氧"},
]

cols_row0 = 4
cols_row1 = 3
margin_x = int(img_width * 0.02)
margin_top = int(img_height * 0.08)
margin_bottom = int(img_height * 0.08)
gap_y = int(img_height * 0.05)

available_height = img_height - margin_top - margin_bottom - gap_y
row_height = available_height // 2

icon_size = min(
    (img_width - margin_x * 2) // cols_row0,
    row_height
)

total_width_row0 = icon_size * cols_row0
start_x = (img_width - total_width_row0) // 2

os.makedirs(output_dir, exist_ok=True)

for icon in icons_info:
    row = icon["row"]
    col = icon["col"]
    
    if row == 0:
        cols = cols_row0
        x = start_x + col * icon_size
    else:
        cols = cols_row1
        total_width_row1 = icon_size * cols
        start_x_row1 = (img_width - total_width_row1) // 2
        x = start_x_row1 + col * icon_size
    
    y = margin_top + row * (row_height + gap_y)
    
    box = (x, y, x + icon_size, y + icon_size)
    cropped = img.crop(box)
    
    output_path = os.path.join(output_dir, f"{icon['name']}.png")
    cropped.save(output_path)
    print(f"Saved: {output_path} ({icon['label']})")

print(f"\nDone! All {len(icons_info)} icons saved to: {output_dir}")
