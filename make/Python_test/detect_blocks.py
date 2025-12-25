import cv2
import numpy as np

def detect_blocks(image_path, output_path):
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Unable to load image {image_path}")
        return

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w > 15 and h > 15:  # 小さすぎるものは除外
            cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)

    cv2.imwrite(output_path, image)
    print(f"Detected blocks image saved as {output_path}")

# 実行例
detect_blocks('e1_test4.png', 'detected_blocks.png')
