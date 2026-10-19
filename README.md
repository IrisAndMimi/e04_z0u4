# 注音文翻譯器

> **「o4e04ji3e; e; z8 vu04u ek7cl3dj42k7z0 u4ej/ rm4」**
>
> **「忘了切輸入法？」**


貼上原始字串，直接翻回中文；也能把中文反過來變成注音文。

無論是：大千、倚天、倉頡、無蝦米，全都能自動認出！

授權：程式碼 [PolyForm Noncommercial 1.0.0](LICENSE.md)（非商業使用）；內嵌資料各有授權，見 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

---

## 規格書

以下是寫給之後要修改這個專案的 Agent(或是人類)。動手前先看完。

### 1. 維護規則

1. **要改功能或畫面，直接改 `index.html`、`css/app.css`、`js/app.js`。** 這三個就是原始碼，GitHub Pages 用的也是它們。
2. **`data/` 裡的兩個檔不要手改。** 它們由 `tools/` 的程式產生，要更新就重跑（見第 3 節）。
3. **改完要跑測試**，`tests/regression.js` 要 `ALL PASS`。行為是刻意改的，就用 `--record` 印出新結果，跟作者確認後再更新 `EXPECTED`。
4. **單檔整合版是產生出來的，不要直接改。** 改過網頁或資料之後，如果也要更新它，跑 `tools/build_single.py`，再用 `--single` 跑一次測試。
5. **`window.__zy` 不要拿掉。** 頁面本身不會用到，但測試要靠它讀內部狀態。
6. 第 5 節「已定案的設計」不要擅自改回去。
7. 與作者合作：
   - 使用繁體中文。
   - 改文案、選項名稱、標籤用字之前先問，不要自行「修正」。
   - 每次改完都要檢查整體、跑一次 code review、逐檔說明每一處調整和原因，搬移、改名的地方要特別講清楚。
   - README 和說明文件**不要用粗話當例子**；頁面內建說明的範例維持原樣。

### 2. 專案地圖

```
.
├── index.html                     # 網頁本體（GitHub Pages 首頁），只放 HTML 結構
├── css/
│   └── app.css                    # 全部樣式
├── js/
│   └── app.js                     # 全部程式邏輯：解碼、選字、自動偵測、畫面更新
├── data/                          # 由 tools/ 產生，不要手改
│   ├── dict.js                    # window.ZY_SYL、window.ZY_DICT：注音音節表＋詞庫
│   └── shape.js                   # window.ZY_SHAPE：倉頡、無蝦米字碼表
├── e04_z0u4(single).html          # 單檔整合版（答案資料寫死在同一支HTML檔案內），適合不想管理多檔案、直接複製單一檔案使用的情境
│
├── tools/
│   ├── build_dict.py              # libchewing-data → data/dict.js
│   ├── build_shape.py             # cin-tables → data/shape.js
│   └── build_single.py            # index.html ＋ css/ ＋ js/ ＋ data/ → 單檔整合版
├── tests/
│   ├── package.json               # 只裝 Playwright
│   └── regression.js              # 回歸測試，22 個情境；--single 改測單檔整合版
├── licenses/
│   └── LGPL-2.1.txt               # 新酷音詞庫的授權全文（LGPL 規定要附）
├── archive/                       # 早期檔案的備份，用不到
│   ├── build_dict.py              # 舊版詞庫轉換（路徑寫死）
│   └── shape_tables.js            # 舊格式的字碼表資料
├── vendor/                        # （不提交）更新資料時 clone 下來的原始資料，見第 3 節
│
├── README.md                      # 本檔
├── LICENSE.md                     # 程式碼授權（PolyForm Noncommercial 1.0.0）
├── THIRD_PARTY_NOTICES.md         # 資料來源與授權
├── .gitignore                     # 排除 vendor/、tests/node_modules/、__pycache__/
└── .nojekyll                      # GitHub Pages 直接發佈靜態檔，不跑 Jekyll
```

網頁載入順序（`index.html` 底部的 `<script src>`，順序不能換）：

```
data/dict.js → data/shape.js → js/app.js
```

資料怎麼來（要更新資料時才跑）：

```
libchewing-data ── build_dict.py ──→ data/dict.js
cin-tables ─────── build_shape.py ─→ data/shape.js
```

單檔整合版怎麼來（要更新單檔整合版時才跑）：

```
index.html + css/ + js/ + data/ ── build_single.py ──→ e04_z0u4(single).html
```

### 3. 指令

在專案根目錄執行；Windows 把 `python3` 換成 `py`。

本機預覽：直接雙擊 `index.html` 就能開，不需要架伺服器。

```bash
# 測試（第一次要先裝 Playwright）
cd tests && npm install && npx playwright install chromium
node regression.js                                 # 測 index.html
node regression.js --single                        # 測單檔整合版
node regression.js --record                        # 印出目前的實際結果
CHROMIUM_PATH=/opt/pw-browsers/chromium node regression.js   # Claude 雲端環境：用現成的 Chromium，不用 install

# 更新單檔整合版
python3 tools/build_single.py

# 更新詞庫／字碼表（原始資料放 vendor/，已列入 .gitignore）
git clone --depth 1 https://github.com/chewing/libchewing-data vendor/libchewing-data
git clone --depth 1 https://github.com/chinese-opendesktop/cin-tables vendor/cin-tables
python3 tools/build_dict.py  vendor/libchewing-data data/dict.js
python3 tools/build_shape.py vendor/cin-tables      data/shape.js
python3 tools/build_single.py                      # 單檔整合版也跟著更新
```

> 目前的資料版本是 libchewing-data `c44e81a`（2026-03-22）、cin-tables `ea28d61`（2026-04-07）。
>
> 用這兩版重跑，產出會跟現在的 `data/` 逐位元組相同。

### 4. 功能規格

以下提到的函式、狀態都在 `js/app.js`；選項、選單的 HTML 在 `index.html`。

#### 4.1 輸入法（`LAYOUTS`）

| key | 名稱 | 類型 | 說明 |
|---|---|---|---|
| `daqian` | 注音文大千 | `zy` | 預設 |
| `eten` | 注音文倚天 | `zy` | |
| `cangjie` | 倉頡碼 | `shape` | 字碼表 `mscj3.cin`（相容微軟倉頡第三代） |
| `boshiamy` | 無蝦米碼 | `shape` | 字碼表 `boshiamy.cin` |
| `zysym` | 注音符號 | `zy`（pseudo） | 直接貼上的注音符號：符號本身就是按鍵，空白或 `ˉ` 是一聲，國字「一」當成ㄧ；`dropSep` 不保留音節間的空白 |
| `cjroot` | 倉頡字根 | `shape`（pseudo） | 直接貼上的字根（日月金木…）。`makeRootLayout()` 把倉頡碼表換成以字根當碼 |
| `bsroot` | 無蝦米字根 | `shape`（pseudo） | 直接貼上的全形字母字根（ＡＢＣ…），作法同上 |

> pseudo 類的 `toPhys` 只用來把符號換回實體按鍵，點亮鍵盤圖。
>
> 選單分組：自動偵測／注音(大千、倚天)／字形(倉頡、無蝦米)／符號(注音符號、倉頡字根、無蝦米字根)
>
> 手動切換輸入法時，左邊的內容會改寫成新輸入法的按法。

#### 4.2 注音解碼（`tokenizeZy`）

- 聲調鍵收尾才確定一個音節：
  - 大千：空白＝一聲、`6`＝ˊ、`3`＝ˇ、`4`＝ˋ、`7`＝˙
  - 倚天：空白＝一聲、`2`＝ˊ、`3`＝ˇ、`4`＝ˋ、`1`＝˙
- 注音分三個位置：聲母（U+3105–3119）、介音（U+3127–3129）、韻母，照位置組字（`compose()`）。同一個位置出現兩個符號 → 不是注音，原樣保留。
- 還沒打聲調的尾巴停在組字區（`typingStart()` 決定從哪裡開始算），下方列出預測字（`predictZy`），點一下補完。
- 輕聲顯示成 `ㄌㄜ˙`，照打字順序；貼上 `˙ㄌㄜ` 也認得。

#### 4.3 智慧選字（`choose`）

- 開啟時用動態規劃挑字：先求段數最少，再求頻率分數最高；詞最長 8 個音節。
- 關閉時每個音節各自取最常用的單字。
- 組字區點字可以鎖定候選字（`S.locks`），選字時會遵守鎖定。
- 每確定一個字就整句重算，被改掉的字會閃一下。

#### 4.4 字形解碼（`tokenizeShape`）

- 字碼後面接空白送出第一個字，接 `1`～`9` 選第幾個。
- 連打沒空白時預設不拆；勾「連打沒空白也斷字」才用最少字數去拆（`segmentCodes`）。
- 打一半的字碼列出以它開頭的字（`predictShape`）。

#### 4.5 設定（`S.opts`，存在 `localStorage` 的 `zyw-settings`，`v:3`）

| 選項名稱 | key | 預設 | 規格 |
|---|---|---|---|
| 自動校正注音順序（ㄛㄨ → ㄨㄛ） | `reorder` | 開 | 照 4.2 的位置規則重排 |
| 智慧選字（依詞組） | `smart` | 開 | 見 4.3 |
| 單位詞之前，純數字不轉換 | `numUnit` | 關 | 一串數字後面（可隔空白）接 `UNIT_RE` 裡的單位、前面是 `PREFIX_RE`（$、第、約、共、剩…），或長度超過一個音節，就當數字原樣保留 |
| 漏打聲調也能辨識 | `endTone1` | 關 | 漏打聲調時自動判斷在哪裡斷字，被漏掉的聲調預設當作一聲（`split()`），不會去猜原本是第幾聲；結果標 `ˉ`，字用紅色虛線框。最後一個還沒打完的字仍留在組字區 |
| 連打沒空白也斷字 | `shapeSplit` | 關 | 見 4.4 |

- 前四個只在注音類輸入法顯示，最後一個只在字形類顯示（`data-for`）。

#### 4.6 紅框提醒

- 被當成一聲的字（紅色虛線框）：**辨識出的字數變多的那一刻**，所有紅框字左右晃一次。還在打、尚未成字的部分不算。不會一直晃。
- 自動偵測「無法辨識」時，左邊輸入框變紅框並晃一次（`markSrcBox`）。

#### 4.7 自動偵測（`autoDetect`，打字停 350 ms 後執行）

- 只有選單選「自動偵測」（`S.auto`）時才跑。手動選了輸入法就關閉；左邊清空後自動回到「自動偵測」。
- 每種輸入法各翻一次並打分數（`scoreLayout`）：分數 ＝ 覆蓋率 ×（0.55 ＋ 0.3 × 成詞率 ＋ 0.15 × 頻率）。
- 判斷順序：
  1. 空白 → 標籤「自動偵測」。
  2. 是中文（`isChinese`：至少 1 個中文字，而且中文字數 ≥ 鍵盤字元數），而且不是字根 → 對調成「中文 → 注音文」，右邊預設大千，中文那一側標籤「偵測到·中文」。字根也是中文字，所以「平均每字 ≥ 2.5 個字根」的那一種輸入法翻得通時，當成字根。
  3. 某個輸入法至少認出 2 個字、分數 ≥ 0.6 → 切過去，標籤「偵測到·〈名稱〉」。跟目前的輸入法分數差不到 0.15 就不換，避免跳來跳去。
  4. 太短，但有輸入法整段翻得通 → 照 `POPULAR` 的順序（大千 > 倚天 > 倉頡 > 無蝦米 > 符號類）挑一個當主結果，其他翻得通的列在結果下方「也可能是：倚天「…」」，點了就切過去並固定（`S.pin`），清空後解除固定。
  5. 認出不到 2 個字、沒有輸入法整段翻得通，而且鍵盤字元少於 6 個 → 「偵測中…」。
  6. 其他 → 「無法辨識」＋紅框晃動（見 4.6）。
- 在「中文 → 注音文」那一側貼上的不是中文，而是某種輸入法（包含很短的輸入）→ 對調回來。只有數字時不對調。

#### 4.8 反向：中文 → 注音文（`S.mode==='gen'`）

- `generate()` 用詞組判斷破音字的讀音；`encodeText()` 轉成按鍵或字碼，倉頡、無蝦米每個字取按鍵最少的字碼。
- 右邊分頁：注音類是「按鍵／注音」，字形類是「按鍵／字根」。分頁狀態 `S.target` 兩個方向共用：`'zh'` 在翻成中文那側是「中文」，在反向那側是「按鍵」。所以 ⇄ 不會讓分頁跳掉。
- 只顯示目前選的那一種輸入法的結果，不列出全部。
- 破音字或多組字碼可以點一下切換（`S.glocks`、`S.gcodes`）。

#### 4.9 ⇄ 與開場範例

- ⇄ 只交換兩邊的文字和方向，分頁不變。
- 開場時兩邊都有範例。**第一次**點進輸入框時，如果內容還是範例就清空（`demo.src`／`demo.g`）。按 ⇄、自動對調、自己打字、點預測字補完之後，旗標就關掉，不再自動清空。

#### 4.10 介面

- 版面仿 Google 翻譯：上方語言列（左：輸入法選單；中：⇄；右：輸出分頁），下方左右兩格。
- 輸入法選單是向下滑開的下拉選單，可以用鍵盤上下選，會跳過隱藏的項目。
- 兩格的 placeholder 都是「請在這裡貼上」。
- 輸入框沒有藍色焦點外框。
- 使用說明和限制收在標題旁的「?」：
  - 看**當下實際用的輸入**決定，不看裝置：滑鼠、觸控板滑過「?」→ 一般提示框（`.hovering`）；鍵盤 Tab 到「?」→ 一般提示框（`.kbd`）；一般提示框按 Esc 會收起，下次滑過或 Tab 到「?」再出現；手指或觸控筆點「?」→ 置中的燈箱（`.open`），點背景、×、或按 Esc 關。燈箱打開、關閉都**只在原位淡入淡出**：關的時候先加 `.closing` 淡出，等淡出結束（`transitionend`，保險 300ms）才拿掉 `.open`；直接拿掉的話，說明框會一邊淡出一邊飛回「?」下面，看起來像彈跳。
  - **不要改回用 `@media (hover / pointer)` 判斷**：有觸控螢幕的 Windows 筆電，Chrome 會回報「沒有滑鼠、只有觸控」（`hover:none`、`pointer:coarse`、`any-pointer:fine` 都不成立），電腦用滑鼠也會被當成手機而變成燈箱。
  - 一般提示框在視窗窄時由 `placeTip()` 往左移，不超出視窗；說明框藏起來時也算在頁寬裡，所以載入、縮放視窗、字型載入、關閉燈箱後都要重算。
- 頁尾標示資料來源和授權。

### 5. 已定案的設計（作者確認過，不要改回去）

- 輕聲寫法 `ㄌㄜ˙`（照打字順序）。
- 選項名稱用 4.5 表格裡的字，名稱後面不加例子。
- 偵測標籤是「偵測到·〈名稱〉」（「偵測到·」在前）、「偵測中…」、「無法辨識」，不加說明文字。
- 有歧義時只給主結果＋「也可能是」，**不要**改成列出全部可能的清單。
- 主結果照使用人數排序；中文 → 注音文預設大千。
- ⇄ 不換分頁；左邊清空回到自動偵測。
- 沒有音效，用紅框和晃動提醒。
- 不在語言列之外多加一排控制項。
- 候選字面板點外面就收起，而且一定有「關閉」。
- 說明框：用手指點才是燈箱；滑鼠滑過則是一般提示框（觸控筆電也一樣）。兩種都不能讓頁面被撐寬。

### 6. 資料格式

- `data/dict.js`、`data/shape.js` 是一般的 JS 檔，用 `<script src>` 載入。不用 JSON 加 `fetch()`，是因為直接雙擊 `index.html`（`file://`）時瀏覽器不允許 `fetch` 讀本機檔，`<script src>` 則可以。
- 檔案開頭有說明註解。大資料用 JS 反引號字串，**一筆一行**：編輯器開得動，更新詞庫時 git 也看得出改了哪幾行。
- 單檔整合版裡的資料是**壓回一行的一般字串**（`build_single.py` 的 `compact_data()` 負責轉換，內容完全相同），只保留說明註解和每個變數各一行，單檔版才不會有好幾萬行。
- `ZY_SYL`：全部注音音節，空白分隔。第 i 個音節在詞庫裡寫成字元 `U+E000 + i`（私用區）。
- `ZY_DICT`：一行一組讀音，格式是「音節碼 TAB 同讀音的字詞串在一起 TAB 每個字詞的頻率等級」。
  - 頻率等級是一個 base36 字元：`min(35, round(log2(頻率+1) × 1.6))`。
  - 多字詞頻率 < 3 的不收。
  - 頁面載入時解析成 `PH`（Map）。
- `ZY_SHAPE`：`{cangjie, boshiamy}`，每個是 `{kn: 鍵→字根, sel: 選字鍵, t: 一行「碼 TAB 字1\u0001字2…」}`。字的順序就是 `.cin` 的候選順序。

### 7. 測試涵蓋範圍（`tests/regression.js`）

大千單字和詞、注音順序校正、倉頡、太短有歧義＋「也可能是」、注音符號、倉頡字根、貼中文自動對調、數字選項預設關、數字加單位不轉（勾選後）、候選字面板與反向面板的關閉和點外面收起、手機說明是燈箱且不撐寬頁面（頁寬必須維持 390）、電腦窄視窗說明仍是滑過顯示且不撐寬（頁寬必須維持 700）、觸控筆電（瀏覽器回報沒有滑鼠）滑鼠滑過是提示框、手指點才是燈箱、手機燈箱開關時位置不跳（逐格記錄位置）、鍵盤 Tab 到「?」會顯示說明且 Esc 收起、桌機說明維持滑過顯示、亂打顯示無法辨識、清空回自動偵測、開場範例第一次點就清空、⇄ 不換分頁，另外檢查頁面沒有 JS 錯誤。

`index.html` 和單檔整合版兩個都要過：`node regression.js`、`node regression.js --single`。

### 8. 之後可以做的方向

- 更多鍵盤配置：許氏、IBM、倚天 26 鍵、大易、行列、速成。在 `LAYOUTS` 加一筆；字形類的字碼表可以從 cin-tables 拿，要先確認授權。
- 大千的半形標點（`, . / ; -`）本身就是注音鍵，夾在注音文裡會被當成注音。目前只能建議使用者用全形標點。
- 英文單字剛好拼成合法注音加聲調時會被翻掉。
