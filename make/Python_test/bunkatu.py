import cv2

# Block 1 の座標とサイズ
x, y, w, h = 668, 768, 16, 63
segment_height = h // 3

# 画像の読み込み
image = cv2.imread("detected_block.png")  # ← ここを実際の画像ファイル名に変更

# 分割線を描画（赤色）
for i in range(1, 3):
    start_point = (x, y + i * segment_height)
    end_point = (x + w, y + i * segment_height)
    cv2.line(image, start_point, end_point, (0, 255, 0), 2)

# 結果を保存
cv2.imwrite("block1_divided.png", image)
