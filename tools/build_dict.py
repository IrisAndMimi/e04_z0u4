#!/usr/bin/env python3
"""把新酷音（libchewing-data）的詞庫轉成網頁用的 data/dict.js（window.ZY_SYL、window.ZY_DICT）。

來源：https://github.com/chewing/libchewing-data
  dict/chewing/tsi.csv、alt.csv（詞）、word.csv（單字）
  授權：LGPL-2.1-or-later，Copyright (c) libchewing Core Team

用法：
  python3 tools/build_dict.py <libchewing-data 資料夾> data/dict.js

輸出格式：
  ZY_SYL ：所有音節（注音），用空白隔開；第 i 個音節在 ZY_DICT 裡寫成字元 U+E000+i
  ZY_DICT：一行一組讀音「音節碼<TAB>字或詞（同讀音的接在一起）<TAB>每個字詞的頻率等級（0-9a-z）」
           同一組依頻率由高到低排；多字詞頻率低於 TH 的不收，避免檔案太大
           ZY_DICT 用 JS 的反引號字串，一組讀音寫成檔案裡的一行，編輯器開得動、git 也看得出改了哪幾行
"""
import collections, json, math, os, re, sys

TH = 3                                                   # 多字詞的最低頻率
CJK = re.compile(r'^[㐀-䶿一-鿿豈-﫿]+$')                    # 只收中日韓統一漢字
B36 = '0123456789abcdefghijklmnopqrstuvwxyz'

def rows(path):
    with open(path, encoding='utf8') as f:
        for line in f:
            if line.startswith('#'):
                continue
            r = line.rstrip('\n').split(',')
            if len(r) >= 3:
                yield r[0], int(r[1]), r[2]

def template_literal(text):                              # 放進 JS 反引號字串：\ ` ${ 要跳脫
    return '`' + text.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${') + '`'

def bucket(f):                                           # 頻率 → 0..35 的等級（取對數壓縮）
    return min(35, round(math.log2(f + 1) * 1.6))

def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    d = os.path.join(sys.argv[1], 'dict', 'chewing')
    out = sys.argv[2]

    entries = collections.defaultdict(int)               # (字詞, 讀音) → 頻率
    for fn in ('tsi.csv', 'alt.csv'):
        for p, f, b in rows(os.path.join(d, fn)):
            if CJK.match(p) and len(b.split()) == len(p):
                entries[(p, b)] = max(entries[(p, b)], f)
    for p, f, b in rows(os.path.join(d, 'word.csv')):    # 單字表只用來補讀音，頻率當 0
        if len(p) == 1 and CJK.match(p):
            entries.setdefault((p, b), 0)

    syls = sorted({b for (p, b) in entries if len(p) == 1})
    sid = {s: i for i, s in enumerate(syls)}
    enc = lambda i: chr(0xE000 + i)

    groups = collections.defaultdict(list)
    for (p, b), f in entries.items():
        ss = b.split()
        if any(s not in sid for s in ss):
            continue                                     # 詞裡有單字表沒有的讀音
        if len(p) > 1 and f < TH:
            continue
        groups[''.join(enc(sid[s]) for s in ss)].append((f, p))

    lines = []
    for k, v in groups.items():
        v.sort(key=lambda x: -x[0])
        lines.append(k + '\t' + ''.join(p for f, p in v) + '\t' + ''.join(B36[bucket(f)] for f, p in v))

    js = ('// 新酷音詞庫轉出來的資料，由 tools/build_dict.py 產生，請不要手改。\n'
          '// 來源：https://github.com/chewing/libchewing-data（LGPL-2.1-or-later）\n'
          '// ZY_SYL：全部注音音節，空白分隔；第 i 個音節在 ZY_DICT 裡寫成字元 U+E000+i\n'
          '// ZY_DICT：一行一組讀音「音節碼<TAB>同讀音的字詞<TAB>每個字詞的頻率等級」\n'
          'window.ZY_SYL=' + json.dumps(' '.join(syls), ensure_ascii=False) + ';\n'
          'window.ZY_DICT=' + template_literal('\n'.join(lines)) + ';\n')
    with open(out, 'w', encoding='utf8', newline='\n') as f:
        f.write(js)
    print(f'音節 {len(syls)}、讀音組 {len(groups)}、{len(js.encode())} bytes')

if __name__ == '__main__':
    main()
