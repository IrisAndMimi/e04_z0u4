#!/usr/bin/env python3
"""把倉頡、無蝦米的 .cin 字碼表轉成網頁用的 data/shape.js（window.ZY_SHAPE）。

來源：https://github.com/chinese-opendesktop/cin-tables
  - mscj3.cin    微軟倉頡三代相容表（cin-tables 整體為 CC0 1.0）
  - boshiamy.cin 嘸蝦米表（檔頭：copyright (c) 行易有限公司，授權方式 Free for non-commercial use）

用法：
  python3 tools/build_shape.py <cin-tables 資料夾> data/shape.js

輸出格式（每種輸入法）：
  kn  ：鍵 → 字根（%keyname 區段，例如 a → 日）
  sel ：選字鍵（%selkey）
  t   ：一行一組字碼「碼<TAB>字1\\u0001字2…」，字的順序 = .cin 裡的候選順序
        t 用 JS 的反引號字串，一組字碼寫成檔案裡的一行，編輯器開得動、git 也看得出改了哪幾行
"""
import json, os, re, sys

TABLES = {            # 網頁裡的名稱 : .cin 檔名
    'cangjie':  'mscj3.cin',
    'boshiamy': 'boshiamy.cin',
}

def template_literal(text):
    # 放進 JS 反引號字串：\ ` ${ 要跳脫；看不見的控制字元（例如分隔字用的 \u0001）寫成 \uXXXX
    text = text.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    text = re.sub(r'[\x00-\x08\x0b-\x1f\x7f]', lambda m: '\\u%04x' % ord(m.group()), text)
    return '`' + text + '`'

def parse_cin(path):
    kn, sel, codes = {}, '', {}
    section = None
    with open(path, encoding='utf-8') as f:
        for raw in f:
            line = raw.rstrip('\r\n')
            if not line or line.startswith('#'):
                continue
            if line.startswith('%'):
                parts = line.split(None, 1)
                key = parts[0]
                arg = parts[1].strip() if len(parts) > 1 else ''
                if key in ('%keyname', '%chardef'):
                    section = key if arg == 'begin' else None
                elif key == '%selkey':
                    sel = arg
                continue
            parts = line.split(None, 1)
            if len(parts) < 2:
                continue
            code, ch = parts[0], parts[1].strip()
            if section == '%keyname':
                kn[code] = ch
            elif section == '%chardef':
                lst = codes.setdefault(code, [])   # dict 保留第一次出現的順序
                if ch not in lst:
                    lst.append(ch)
    t = '\n'.join(code + '\t' + '\u0001'.join(chs) for code, chs in codes.items())
    return {'kn': kn, 'sel': sel, 't': t}

def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = sys.argv[1], sys.argv[2]
    data = {name: parse_cin(os.path.join(src, fn)) for name, fn in TABLES.items()}
    js = ['// 倉頡、無蝦米字碼表轉出來的資料，由 tools/build_shape.py 產生，請不要手改。\n'
          '// 來源：https://github.com/chinese-opendesktop/cin-tables（授權見 THIRD_PARTY_NOTICES.md）\n'
          '// 每種輸入法：kn＝鍵→字根，sel＝選字鍵，t＝一行一組「碼<TAB>字1\\u0001字2…」\n'
          'window.ZY_SHAPE={\n']
    for i, (name, d) in enumerate(data.items()):
        js.append(json.dumps(name) + ':{"kn":' + json.dumps(d['kn'], ensure_ascii=False)
                  + ',"sel":' + json.dumps(d['sel'], ensure_ascii=False)
                  + ',"t":' + template_literal(d['t']) + '}' + (',' if i < len(data) - 1 else '') + '\n')
    js.append('};\n')
    with open(out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(''.join(js))
    for name, d in data.items():
        print(f'{name}: {d["t"].count(chr(10)) + 1} 組字碼')

if __name__ == '__main__':
    main()
