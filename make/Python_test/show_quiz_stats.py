import json

def load_stats(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ファイル '{file_path}' が見つかりません。")
        return {}
    except json.JSONDecodeError:
        print(f"ファイル '{file_path}' の読み込み中にエラーが発生しました。")
        return {}

def compute_metrics(stats):
    computed = []
    for song, data in stats.items():
        correct = data.get("correct", 0)
        incorrect = data.get("incorrect", 0)
        total = correct + incorrect
        accuracy = (correct / total * 100) if total > 0 else 0
        display_counts = data.get("display_counts", [])
        avg_display = (sum(display_counts) / len(display_counts)) if display_counts else 0
        computed.append({
            "song": song,
            "correct": correct,
            "incorrect": incorrect,
            "total": total,
            "accuracy": accuracy,
            "avg_display": avg_display
        })
    return computed

def get_sort_key():
    print("\n並び替え項目を選んでください：")
    print("1. 正解数")
    print("2. 不正解数")
    print("3. 合計挑戦数")
    print("4. 正答率（％）")
    print("5. 平均表示回数（正解時）")
    choice = input("番号を入力（1〜5）: ").strip()
    mapping = {
        "1": "correct",
        "2": "incorrect",
        "3": "total",
        "4": "accuracy",
        "5": "avg_display"
    }
    return mapping.get(choice, "accuracy")

def get_sort_order():
    order = input("昇順で表示しますか？（y/n）: ").strip().lower()
    return True if order == 'y' else False

def get_display_limit():
    limit = input("表示件数の上限を入力（空欄ならすべて）: ").strip()
    if limit.isdigit():
        return int(limit)
    return None

def display_stats(sorted_stats, limit=None):
    print("\n=== 累積クイズ成績（並び替え済み） ===")
    count = 0
    for entry in sorted_stats:
        print(f"\n🎵 {entry['song']}")
        print(f"  正解数: {entry['correct']}")
        print(f"  不正解数: {entry['incorrect']}")
        print(f"  合計挑戦数: {entry['total']}")
        print(f"  正答率: {entry['accuracy']:.1f}%")
        print(f"  平均表示回数（正解時）: {entry['avg_display']:.2f}")
        count += 1
        if limit and count >= limit:
            break

def get_filter_conditions():
    filters = {}
    print("\n🎤 曲名で検索しますか？（空欄ならすべて）:")
    song_name = input("→ ").strip()
    if song_name:
        filters["song_name"] = song_name

    metric_mapping = {
        "1": "correct",
        "2": "incorrect",
        "3": "total",
        "4": "accuracy",
        "5": "avg_display"
    }

    while True:
        print("\n🔍 絞り込み対象の項目を選んでください：")
        print("1. 正解数")
        print("2. 不正解数")
        print("3. 合計挑戦数")
        print("4. 正答率（％）")
        print("5. 平均表示回数（正解時）")
        choice = input("→ ").strip()
        metric = metric_mapping.get(choice)
        if not metric:
            print("無効な選択です。")
            continue

        min_val = input(f"📉 {metric} の最小値を入力してください（空欄なら指定なし）: ").strip()
        max_val = input(f"📈 {metric} の最大値を入力してください（空欄なら指定なし）: ").strip()

        filters[metric] = {}
        if min_val.replace('.', '', 1).isdigit():
            filters[metric]["min"] = float(min_val)
        if max_val.replace('.', '', 1).isdigit():
            filters[metric]["max"] = float(max_val)

        more = input("➕ さらに条件を追加しますか？（y/n）: ").strip().lower()
        if more != 'y':
            break

    return filters

def filter_by_conditions(stats, filters):
    filtered = []
    for entry in stats:
        if "song_name" in filters:
            if filters["song_name"].lower() not in entry["song"].lower():
                continue

        match = True
        for key in ["correct", "incorrect", "total", "accuracy", "avg_display"]:
            if key in filters:
                min_val = filters[key].get("min")
                max_val = filters[key].get("max")
                value = entry[key]
                if min_val is not None and value < min_val:
                    match = False
                    break
                if max_val is not None and value > max_val:
                    match = False
                    break
        if match:
            filtered.append(entry)
    return filtered

def display_filtered_stats(filtered_stats):
    if not filtered_stats:
        print("\n⚠️ 条件に一致するデータが見つかりませんでした。")
        return

    print("\n=== 条件に一致したクイズ成績 ===")
    for entry in filtered_stats:
        print(f"\n🎵 {entry['song']}")
        print(f"  正解数: {entry['correct']}")
        print(f"  不正解数: {entry['incorrect']}")
        print(f"  合計挑戦数: {entry['total']}")
        print(f"  正答率: {entry['accuracy']:.1f}%")
        print(f"  平均表示回数（正解時）: {entry['avg_display']:.2f}")

def main():
    stats_file = "quiz_stats.json"
    stats = load_stats(stats_file)
    if not stats:
        return

    computed_stats = compute_metrics(stats)

    print("=== クイズ成績表示プログラム ===")
    print("1. ランキング表示（並び替え・件数指定）")
    print("2. 条件付き検索（曲名・正答率・挑戦回数など）")
    mode = input("番号を選んでください（1または2）: ").strip()

    if mode == "1":
        sort_key = get_sort_key()
        ascending = get_sort_order()
        limit = get_display_limit()
        sorted_stats = sorted(computed_stats, key=lambda x: x[sort_key], reverse=not ascending)
        display_stats(sorted_stats, limit)
    elif mode == "2":
        filters = get_filter_conditions()
        filtered = filter_by_conditions(computed_stats, filters)
        display_filtered_stats(filtered)
    else:
        print("無効な選択です。終了します。")

if __name__ == "__main__":
    main()

