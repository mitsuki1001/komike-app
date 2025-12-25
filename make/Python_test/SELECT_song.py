import os
import random

def pick_random_file(folder_path):
    try:
        files = [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f))]
        
        if not files:
            print("フォルダ内にファイルが存在しません。")
            return None
        
        selected_file = random.choice(files)
        print(f"選ばれたファイル: {selected_file}")
        return os.path.join(folder_path, selected_file)

    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return None

def open_file_if_text(file_path):
    if file_path.lower().endswith(".txt"):
        choice = input("このファイルを開きますか？ (y/n): ").strip().lower()
        if choice == 'y':
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    print("\n--- ファイルの内容 ---")
                    print(content)
                    print("--- 終了 ---")
            except Exception as e:
                print(f"ファイルを開けませんでした: {e}")
        else:
            print("ファイルは開かれませんでした。")
    else:
        print("選ばれたファイルはテキストファイルではありません。")

# 使用例（パスを適宜変更）
folder_path = r"C:\2002248\memo\song"
file_path = pick_random_file(folder_path)
if file_path:
    open_file_if_text(file_path)
