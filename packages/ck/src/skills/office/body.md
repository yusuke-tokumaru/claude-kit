# office

Excel・PowerPoint・Word ファイルを解析してテキスト化する。  
引数にファイルパスを指定する: `/office /path/to/file.xlsx`

## Step 1: ファイルパスを確認する

`$ARGUMENTS` からファイルパスを取得する。指定がない場合はユーザーにパスを尋ねる。

ファイルの拡張子からファイル種別を判定する:
- `.xlsx` / `.xls` → Excel
- `.pptx` → PowerPoint
- `.docx` → Word
- それ以外 → 「対応していない形式です（xlsx/xls/pptx/docx のみ）」と伝えて終了

## Step 2: 必要ライブラリを確認・インストールする

**Excel の場合:**
```bash
python3 -c "import openpyxl" 2>/dev/null || pip3 install --user openpyxl -q
```

**PowerPoint の場合:**
```bash
python3 -c "import pptx" 2>/dev/null || pip3 install --user python-pptx -q
```

**Word の場合:**
```bash
python3 -c "import docx" 2>/dev/null || pip3 install --user python-docx -q
```

## Step 3: ファイルを解析する

### Excel (.xlsx / .xls)

```bash
python3 - <<'EOF'
import openpyxl, sys

wb = openpyxl.load_workbook("<ファイルパス>", data_only=True)
for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    print(f"\n## シート: {sheet_name}  ({ws.max_row}行 × {ws.max_column}列)")
    for row in ws.iter_rows(values_only=True):
        if any(v is not None for v in row):
            print("\t".join(str(v) if v is not None else "" for v in row))
EOF
```

### PowerPoint (.pptx)

```bash
python3 - <<'EOF'
from pptx import Presentation

prs = Presentation("<ファイルパス>")
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
EOF
```

### Word (.docx)

```bash
python3 - <<'EOF'
from docx import Document

doc = Document("<ファイルパス>")
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
EOF
```

## Step 4: 解析結果を提示する

出力を整形してユーザーに提示する。行数が多い場合（100行超）は先頭 50 行と末尾 10 行を示し、全件表示が必要か確認する。

ファイルの概要として以下を先頭に表示する:
- ファイル名
- 種別（Excel / PowerPoint / Word）
- 規模（シート数・行数 / スライド数 / 段落数）

## 制約

- ファイルが存在しない場合は「ファイルが見つかりません: <パス>」と伝えて終了する
- パスワード保護されたファイルはエラーになる場合がある。その旨をユーザーに伝える
- 画像・図形のテキスト以外の内容（グラフデータ等）は取得できない
