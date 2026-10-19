# 第三方資料與授權

本專案自己寫的程式碼（`index.html`、`css/`、`js/`、`tools/`、`tests/`）採用 [PolyForm Noncommercial 1.0.0](LICENSE.md)。

以下資料**不是**本專案寫的，各自保有原本的授權；它們被轉換後存在 `data/`，由 `index.html` 載入，也會內嵌進單檔整合版（`archive/shape_tables.js` 是同一份字碼表資料的舊格式）。

| 資料 | 來源 | 用在哪裡 | 授權 |
|---|---|---|---|
| 新酷音詞庫（`tsi.csv`、`alt.csv`、`word.csv`） | [chewing/libchewing-data](https://github.com/chewing/libchewing-data)，Copyright (c) libchewing Core Team | `tools/build_dict.py` 轉成 `data/dict.js`（音節表＋詞庫，已去掉罕用詞） | LGPL-2.1-or-later，全文見 [licenses/LGPL-2.1.txt](licenses/LGPL-2.1.txt) |
| 倉頡字碼表 `mscj3.cin`（相容微軟倉頡第三代） | [chinese-opendesktop/cin-tables](https://github.com/chinese-opendesktop/cin-tables) | `tools/build_shape.py` 轉成 `data/shape.js` 的 `cangjie` | cin-tables 專案整體以 CC0 1.0 釋出 |
| 嘸蝦米字碼表 `boshiamy.cin` | 同上；檔頭註明「copyright (c) 行易有限公司」「格式轉換：趙惟倫, 2007」 | `tools/build_shape.py` 轉成 `data/shape.js` 的 `boshiamy` | 檔頭寫明 **Free for non-commercial use**（限非商業使用） |
| 網頁字型 Noto Sans TC、LXGW WenKai TC、JetBrains Mono | Google Fonts（開網頁時線上載入，沒有包進專案） | 介面字型 | SIL Open Font License 1.1 |

## 說明

- **新酷音詞庫（LGPL）**：`data/dict.js` 是由新酷音詞庫轉換出來的，所以這一部分仍然是 LGPL-2.1-or-later，
  不受本專案的「非商業」條款限制。轉換方式完整公開在 `tools/build_dict.py`，任何人都可以用新版或修改過的詞庫重新產生、替換。
- **嘸蝦米字碼表**：cin-tables 專案本身標示 CC0，但 `boshiamy.cin` 檔頭保留了行易有限公司的版權聲明與「限非商業使用」，
  本專案以較嚴格的檔頭聲明為準。「嘸蝦米」是行易有限公司的商標，本專案與行易有限公司沒有任何關係。
- 「倉頡」「大千」「倚天」等名稱只用來指稱鍵盤配置，本專案與相關公司沒有任何關係。
- 以上為整理資訊，不構成法律意見。
