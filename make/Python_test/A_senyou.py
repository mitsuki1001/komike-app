import json

def divide_block(x, y, width, height, vertical_segments, horizontal_segments):
    sub_blocks = {}
    block_width = width / horizontal_segments
    block_height = height / vertical_segments

    block_id = 1
    for i in range(vertical_segments):
        for j in range(horizontal_segments):
            sub_blocks[f"Block_{block_id}"] = {
                "x": x + j * block_width,
                "y": y + i * block_height,
                "width": block_width,
                "height": block_height
            }
            block_id += 1

    return sub_blocks

def save_to_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def sort_blocks(blocks, order, start_number):
    if order == "left_to_right_bottom_to_top":
        sorted_blocks = sorted(blocks.items(), key=lambda x: (x[1]['x'], -x[1]['y']))
    elif order == "bottom_to_top_right_to_left":
        sorted_blocks = sorted(blocks.items(), key=lambda x: (-x[1]['y'], -x[1]['x']))
    elif order == "right_to_left_top_to_bottom":
        sorted_blocks = sorted(blocks.items(), key=lambda x: (-x[1]['x'], x[1]['y']))
    elif order == "top_to_bottom_left_to_right":
        sorted_blocks = sorted(blocks.items(), key=lambda x: (x[1]['y'], x[1]['x']))
    else:
        raise ValueError("Invalid sort order")

    renamed_blocks = {f"a{str(idx + start_number).zfill(2)}": v for idx, (k, v) in enumerate(sorted_blocks)}
    return renamed_blocks

if __name__ == "__main__":
    x = 436
    y = 555
    width = 55
    height = 37
    vertical_segments = 1
    horizontal_segments = 3

    sub_blocks = divide_block(x, y, width, height, vertical_segments, horizontal_segments)

    orders = {
        "1": "left_to_right_bottom_to_top",
        "2": "bottom_to_top_right_to_left",
        "3": "right_to_left_top_to_bottom",
        "4": "top_to_bottom_left_to_right"
    }

    print("並び順を選んでください：")
    print("1: 左から右、下から上")
    print("2: 下から上、右から左")
    print("3: 右から左、上から下")
    print("4: 上から下、左から右")
    choice = input("番号を入力してください（1〜4）: ")

    if choice in orders:
        order = orders[choice]
        start_number = int(input("連番の開始番号を入力してください（例: 11 → A11から）: "))
        filename = f"sorted_{order}.json"
        sorted_blocks = sort_blocks(sub_blocks, order, start_number)
        save_to_json(sorted_blocks, filename)
        print(f"{filename} に保存しました。")
    else:
        print("無効な選択です。もう一度実行してください。")
