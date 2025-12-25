import os
import random
import re
import json

def pick_random_file(folder_path):
    files = [f for f in os.listdir(folder_path) if f.endswith(".txt")]
    if not files:
        print("テキストファイルが見つかりません。")
        return None
    return os.path.join(folder_path, random.choice(files))

def normalize(text):
    return re.sub(r'[^\w]', '', text.lower())

def evaluate_answer(user_answer, correct_answer):
    if user_answer.lower() == correct_answer.lower():
        return "perfect", 0
    elif normalize(user_answer) == normalize(correct_answer):
        return "partial", 1
    else:
        return "wrong", None

def show_quiz(file_path, max_times=3):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            all_lines = f.readlines()

        valid_lines = [line for line in all_lines if line.strip() != '']
        total_valid = len(valid_lines)
        filename = os.path.splitext(os.path.basename(file_path))[0]
        print(f"\nクイズ開始！（有効行数: {total_valid}）")

        masked_lines = []
        original_lines = []
        shown_info = []
        display_count = 0
        used_ranges = []

        for i in range(max_times):
            user_input = input(f"\nEnterキーで {i+1} 回目の表示、または 'a' で回答モードへ: ").strip().lower()
            if user_input == 'a':
                break

            display_count += 1
            num_lines = random.randint(1, 3)

            if total_valid < num_lines:
                print("有効な行が足りません。")
                break

            # 重複しない範囲を探す（最大100回試行）
            for _ in range(100):
                start = random.randint(0, total_valid - num_lines)
                end = start + num_lines
                overlap = any(not (end <= r_start or start >= r_end) for r_start, r_end in used_ranges)
                if not overlap:
                    used_ranges.append((start, end))
                    break
            else:
                print("重複しない行が見つかりませんでした。")
                break

            selected = valid_lines[start:end]
            shown_info.append((start + 1, end))

            print(f"\n--- {i+1} 回目（{start+1}〜{end}行目） ---")
            for line in selected:
                masked_line = re.compile(re.escape(filename), re.IGNORECASE).sub("*****", line)
                masked_lines.append(masked_line)
                original_lines.append(line)
                print(masked_line.strip())
            print("--- 終了 ---")

        print("\n回答モードに入ります。")
        user_answer = input("この文章の元ファイル名は？（拡張子なしで入力）: ").strip()
        match_type, penalty = evaluate_answer(user_answer, filename)

        if match_type == "perfect":
            print(f"✅ 完全一致！→ 正解は「{filename}」です。")
        elif match_type == "partial":
            print(f"⚠ 部分一致（記号違いなど） → 正解は「{filename}」です。")
        else:
            print(f"❌ 不正解です。正解は「{filename}」でした。")

        print("\n--- 表示された全文（答え） ---")
        index = 0
        for idx, (start, end) in enumerate(shown_info):
            print(f"\n【{idx+1} 回目：{start}〜{end}行目】")
            for _ in range(end - start + 1):
                print(original_lines[index].strip())
                index += 1
        print("--- 終了 ---")

        base_point = max(10 - (display_count - 1) * 3, 0)
        if match_type in ["perfect", "partial"]:
            return True, base_point, display_count, filename
        else:
            return False, 0, display_count, filename

    except Exception as e:
        print(f"エラーが発生しました: {e}")
        return False, 0, 0, None

# === メイン処理 ===
folder_path = r"C:\2002248\memo\song"  # ← 実在するフォルダに変更してください
stats_file = "quiz_stats.json"
summary_file = "session_summary.txt"

# 累積データの読み込み
if os.path.exists(stats_file):
    with open(stats_file, 'r', encoding='utf-8') as f:
        song_stats = json.load(f)
else:
    song_stats = {}

# 今回のセッション統計
session_stats = {
    "correct": 0,
    "incorrect": 0,
    "total_score": 0,
    "display_counts": []
}

# クイズ実行（最大10回）
for round_num in range(1, 11):
    print(f"\n=== 第 {round_num} 回クイズ ===")
    file_path = pick_random_file(folder_path)
    if file_path:
        result, point, display_count, filename = show_quiz(file_path)
        if filename:
            if filename not in song_stats:
                song_stats[filename] = {
                    "correct": 0,
                    "incorrect": 0,
                    "display_counts": []
                }

            if result:
                song_stats[filename]["correct"] += 1
                song_stats[filename]["display_counts"].append(display_count)
                session_stats["correct"] += 1
                session_stats["total_score"] += point
                session_stats["display_counts"].append(display_count)
                print(f"✅ 正解（{display_count} 回目の表示で正解） 得点: {point}点")
            else:
                song_stats[filename]["incorrect"] += 1
                session_stats["incorrect"] += 1
                print("❌ 不正解 得点: 0点")
    else:
        print("ファイルが見つかりません。")
        break

# 累積データ保存（スコアは含めない）
with open(stats_file, 'w', encoding='utf-8') as f:
    json.dump(song_stats, f, ensure_ascii=False, indent=2)

# セッション結果をファイルに保存
total_attempts = session_stats["correct"] + session_stats["incorrect"]
avg_display = (sum(session_stats["display_counts"]) / len(session_stats["display_counts"])) if session_stats["display_counts"] else 0

with open(summary_file, 'w', encoding='utf-8') as f:
    f.write("=== 今回のクイズ結果（10回分） ===\n")
    f.write(f"✅ 正解数: {session_stats['correct']} / {total_attempts} 回\n")
    f.write(f"❌ 不正解数: {session_stats['incorrect']}\n")
    f.write(f"🎯 合計スコア: {session_stats['total_score']}点（最大100点）\n")
    f.write(f"📊 平均表示回数（正解時）: {avg_display:.2f}\n")

# 画面にも表示
print("\n=== 今回のクイズ結果（10回分） ===")
print(f"✅ 正解数: {session_stats['correct']} / {total_attempts} 回")
print(f"❌ 不正解数: {session_stats['incorrect']}")
print(f"🎯 合計スコア: {session_stats['total_score']}点（最大100点）")
print(f"📊 平均表示回数（正解時）: {avg_display:.2f}")
