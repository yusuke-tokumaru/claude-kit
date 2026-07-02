# office

Excel・PowerPoint・Word ファイルを解析してテキスト化する。  
引数にファイルパスを指定する: `/office /path/to/file.xlsx`

## Step 1: ファイルパスを確認する

`$ARGUMENTS` からファイルパスを取得する。指定がない場合はユーザーにパスを尋ねる。

ファイルの拡張子からファイル種別を判定する:
- `.xlsx` → Excel（`.xls` は非対応。openpyxl が xlsx のみサポートするため）
- `.pptx` → PowerPoint
- `.docx` → Word
- それ以外 → 「対応していない形式です（xlsx/pptx/docx のみ。旧形式 xls は非対応）」と伝えて終了

## Step 2: 実行環境を決める

必要パッケージ: Excel → `openpyxl` / PowerPoint → `python-pptx` / Word → `python-docx`

```bash
which uv
```

- **uv がある場合（推奨）**: インストール不要。Step 3 のスクリプトを
  `uv run --with <パッケージ> python - "<ファイルパス>"` で実行する
- **uv が無い場合**: モジュールの有無を確認し、無ければ次の順で試す（成功した時点で止める）:
  1. `python3 -c "import <モジュール>" 2>/dev/null` → あれば `python3 -` で実行
  2. `python3 -m pip install --user <パッケージ> -q`
  3. PEP 668（`externally-managed-environment`）エラーの場合:
     `python3 -m pip install --user --break-system-packages <パッケージ> -q`
  4. pip 自体が無い場合（`No module named pip`）: uv のインストール
     （`curl -LsSf https://astral.sh/uv/install.sh | sh`）または `sudo apt install python3-pip`
     をユーザーに案内して停止する（sudo を伴うためスキルからは実行しない）

## Step 3: ファイルを解析する

以下のスクリプトは `python3 -` で表記する。uv を使う場合は
`python3 -` を `uv run --with <パッケージ> python -` に読み替える。

### Excel (.xlsx)

シートあたりの出力上限（既定 200 行）をスクリプト側で打ち切る。巨大ファイルの全行出力はコンテキストを食い潰すため、省略が出た場合は必要な範囲を確認してから第2引数で上限を上げて再実行する。

```bash
python3 - "<ファイルパス>" [上限行数] <<'EOF'
import openpyxl, sys

MAX_ROWS = int(sys.argv[2]) if len(sys.argv) > 2 else 200  # シートあたりの出力上限（非空行ベース）

try:
    wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        print(f"\n## シート: {sheet_name}  ({ws.max_row}行 × {ws.max_column}列)")
        printed = omitted = 0
        for row in ws.iter_rows(values_only=True):
            if any(v is not None for v in row):
                if printed < MAX_ROWS:
                    print("\t".join(str(v) if v is not None else "" for v in row))
                    printed += 1
                else:
                    omitted += 1
        if omitted:
            print(f"…非空行 {omitted} 行を省略（全件必要なら上限行数を第2引数に指定して再実行）")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
EOF
```

### PowerPoint (.pptx)

```bash
python3 - "<ファイルパス>" <<'EOF'
from pptx import Presentation
import sys

try:
    prs = Presentation(sys.argv[1])
    for i, slide in enumerate(prs.slides, 1):
        print(f"\n## スライド {i}")
        for shape in slide.shapes:
            if shape.has_text_frame:
                for para in shape.text_frame.paragraphs:
                    text = para.text.strip()
                    if text:
                        print(text)
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text.strip()
            if notes:
                print(f"\n> ノート: {notes}")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
EOF
```

### Word (.docx)

```bash
python3 - "<ファイルパス>" <<'EOF'
from docx import Document
import sys

try:
    doc = Document(sys.argv[1])
    for para in doc.paragraphs:
        if para.text.strip():
            style = para.style.name
            if style.startswith("Heading"):
                level = style.replace("Heading ", "")
                print(f"\n{'#' * int(level)} {para.text}")
            else:
                print(para.text)

    for i, table in enumerate(doc.tables, 1):
        print(f"\n### 表 {i}")
        for row in table.rows:
            print(" | ".join(cell.text.strip() for cell in row.cells))
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
EOF
```

## Step 4: 解析結果を提示する

出力を整形してユーザーに提示する。行数が多い場合（100行超）は先頭 50 行と末尾 10 行を示し、全件表示が必要か確認する。Excel はスクリプト側でシートあたり 200 行（既定）に打ち切っているため、省略行の表示があれば「どの範囲が必要か」を確認してから上限を上げて再実行する。

ファイルの概要として以下を先頭に表示する:
- ファイル名
- 種別（Excel / PowerPoint / Word）
- 規模（シート数・行数 / スライド数 / 段落数）

## 制約

- ファイルが存在しない場合は「ファイルが見つかりません: <パス>」と伝えて終了する
- パスワード保護されたファイルはエラーになる場合がある。その旨をユーザーに伝える
- 画像・図形のテキスト以外の内容（グラフデータ等）は取得できない
