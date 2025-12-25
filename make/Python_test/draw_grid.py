import cv2
import numpy as np

def draw_grid(image_path, output_path, grid_size=40):
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Unable to load image {image_path}")
        return

    height, width, _ = image.shape
    grid_image = image.copy()

    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.5
    font_thickness = 1
    font_color = (0, 0, 255)

    for y in range(0, height, grid_size):
        for x in range(0, width, grid_size):
            cv2.rectangle(grid_image, (x, y), (x + grid_size, y + grid_size), (255, 0, 0), 1)
            row_label = chr(65 + (y // grid_size))
            col_label = str((x // grid_size) + 1)
            label = f"{row_label}-{col_label}"
            text_size, _ = cv2.getTextSize(label, font, font_scale, font_thickness)
            text_x = x + (grid_size - text_size[0]) // 2
            text_y = y + (grid_size + text_size[1]) // 2
            cv2.putText(grid_image, label, (text_x, text_y), font, font_scale, font_color, font_thickness)

    cv2.imwrite(output_path, grid_image)
    print(f"Grid image saved as {output_path}")

# 実行例
draw_grid('map.png', 'map_with_grid.png')
