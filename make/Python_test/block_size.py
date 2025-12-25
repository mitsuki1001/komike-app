import cv2
import numpy as np

def detect_blocks(image_path):
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    blocks = []
    for i, contour in enumerate(contours):
        x, y, w, h = cv2.boundingRect(contour)
        blocks.append((x, y, w, h))
        # ブロックの枠を描画
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        # ブロック番号を描画
        cv2.putText(image, f"{i + 1}", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    cv2.imwrite('detected_block.png', image)
    return blocks

# 使用例
image_path = 'east_456_block.jpg'  # ← ここを実際の画像パスに変更
blocks = detect_blocks(image_path)

for i, (x, y, w, h) in enumerate(blocks):
    print(f"Block {i + 1}: x={x}, y={y}, width={w}, height={h}")
