
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
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

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

    # Save the coordinates to a JSON file
    save_to_json(sub_blocks, 'sub_block_coordinates.json')
