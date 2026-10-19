#!/usr/bin/env python3
"""產生「單檔整合版」：把 index.html 用到的 css/、js/、data/ 全部塞進同一支 HTML。

平常不用跑。只有想更新單檔整合版時才需要（例如改了 index.html、css、js 或 data 之後）。

用法（在專案根目錄執行）：
  python3 tools/build_single.py                         # → e04_z0u4(single).html
  python3 tools/build_single.py -o 別的位置.html          # 指定輸出位置

處理方式：
  <link rel="stylesheet" href="css/…">   → <style>…</style>
  <script src="js/…"></script>、data/…   → <script>…</script>
  外部網址（Google Fonts）維持原樣。
"""
import argparse, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'e04_z0u4(single).html')
NOTE = '<!-- 單檔整合版：由 tools/build_single.py 從 index.html、css/、js/、data/ 組出來，請不要直接改這個檔 -->\n'

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()

def inline_js(js):
    # 塞進 <script> 時，</script> 會提早結束、<!-- 會讓瀏覽器誤判，都先拆開
    # （JS 的字串、反引號字串、正規表示式裡 \/ 等於 /、\! 等於 !，意思不變）
    js = re.sub(r'</(script)', r'<\\/\1', js, flags=re.I)
    return js.replace('<!--', '<\\!--')

def inline_css(css):
    if re.search(r'</style', css, re.I):
        raise SystemExit('CSS 裡出現 </style，無法直接塞進 <style>')
    return css

def main():
    ap = argparse.ArgumentParser(description='產生單檔整合版')
    ap.add_argument('-o', '--out', default=OUT, help='輸出檔案（預設是專案根目錄的 e04_z0u4(single).html）')
    a = ap.parse_args()

    html = read('index.html')
    html, n_css = re.subn(r'<link rel="stylesheet" href="((?!https?:)[^"]+)">',
                          lambda m: '<style>\n' + inline_css(read(m.group(1))) + '</style>', html)
    html, n_js = re.subn(r'<script src="((?!https?:)[^"]+)"></script>',
                         lambda m: '<script>\n' + inline_js(read(m.group(1))) + '</script>', html)
    if n_css == 0 or n_js == 0:
        raise SystemExit('index.html 裡找不到要塞進來的 css 或 js，是不是改了引用的寫法？')
    # 還有本機檔沒被塞進來（例如寫成 <script defer src=…>）→ 單檔版會缺檔，直接報錯
    left = re.findall(r'<(?:script|link)\b[^>]*\b(?:src|href)="(?!https?:)[^"]*"[^>]*>', html)
    if left:
        raise SystemExit('這些本機檔沒有被塞進單檔版，請改成 <script src="…"></script> 或 '
                         '<link rel="stylesheet" href="…"> 的寫法：\n  ' + '\n  '.join(left))
    i = html.index('<head>') + len('<head>')
    html = html[:i] + NOTE + html[i:]

    with open(a.out, 'w', encoding='utf-8', newline='\n') as f:
        f.write(html)
    print(f'{a.out}  {len(html.encode()):,} bytes（css {n_css} 個、js {n_js} 個）')

if __name__ == '__main__':
    main()
