
# Define the function to divide a block into specified vertical and horizontal segments
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

# Define the function to save the coordinates to a JSON file
import json

def save_to_json(data, filename):
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


# Define the function to sort the blocks
def sort_blocks(blocks):
    even_blocks = {k: v for k, v in blocks.items() if int(k.split('_')[1]) % 2 == 0}
    odd_blocks = {k: v for k, v in blocks.items() if int(k.split('_')[1]) % 2 != 0}

    sorted_even = sorted(even_blocks.items(), key=lambda x: int(x[0].split('_')[1]), reverse=True)
    sorted_odd = sorted(odd_blocks.items(), key=lambda x: int(x[0].split('_')[1]))

    renamed_blocks = {}
    
    # 偶数ブロックの命名：A08, A07, ..., A01
    for idx, (k, v) in enumerate(sorted_even):
        new_id = f"ス{str(20 + idx).zfill(2)}"
        renamed_blocks[new_id] = v

    # 奇数ブロックの命名：あ47, あ48, ..., あ54
    for idx, (k, v) in enumerate(sorted_odd):
        new_id = f"ス{str(25 + idx)}"
        renamed_blocks[new_id] = v

    return renamed_blocks
# Example usage
if __name__ == "__main__":
    # Define the block parameters
    x = 1413
    y = 125
    width = 37
    height = 91
    vertical_segments = 5
    horizontal_segments = 2

    # Divide the block and get the coordinates
    sub_blocks = divide_block(x, y, width, height, vertical_segments, horizontal_segments)

    # Sort the blocks
    sorted_sub_blocks = sort_blocks(sub_blocks)

    # Save the coordinates to a JSON file
    save_to_json(sorted_sub_blocks, 'sorted_sub_block_coordinates.json')
