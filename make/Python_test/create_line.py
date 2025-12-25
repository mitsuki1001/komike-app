from PIL import Image, ImageDraw

# 画像を読み込む
image_path = 'east_7.jpg'  # ここに画像ファイルのパスを指定
image = Image.open(image_path)

# 描画用のオブジェクトを作成
draw = ImageDraw.Draw(image)

# 矩形の座標とサイズ
x, y = 5, 1111
width, height = 24, 23

# 緑色の枠線で矩形を描画
draw.rectangle([x, y, x + width, y + height], outline="lightgreen", width=3)

# 画像を保存
output_path = 'output_image.png'
image.save(output_path)

print(f"緑色の矩形を描画した画像を {output_path} に保存しました。")
