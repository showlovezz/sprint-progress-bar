# Sprint Progress Bar

一個給前端 team 自用的 sprint 管理小工具：Sprint 編號 / 起迄 / 進度條、任務 CRUD、甘特圖時間軸、PM 里程碑。起點是取代 Google Sheet，主軸是**前端 team 執行面**（不是 PM Leader 的跨季排程）。

---

## 技術棧

- **框架**：React 19 + Vite + TypeScript
- **樣式**：Tailwind CSS v4（`@import "tailwindcss"` + `@tailwindcss/vite` plugin）
- **路由**：react-router-dom v6
  - `/` → `SprintListPage`
  - `/sprint/:sprintId` → `SprintDetailPage`
- **資料**：localStorage（Phase 3 會搬 Supabase）
  - Key：`sprint-progressbar.sprints` / `sprint-progressbar.tasks`
  - Hook：`useSprints` / `useTasks` 介面設計成 Supabase 換接時不動元件
- **Node**：22 LTS（`.zprofile` 已設 `nvm use default`，新開 shell 自動切）
  - Claude Code 的 `.claude/launch.json` 指定絕對路徑 `/Users/vita/.nvm/versions/node/v22.22.2/bin/node`

---

## 目錄結構

```
src/
├── App.tsx                         # Router
├── main.tsx
├── index.css                       # Tailwind + 全域 base 規則
├── types.ts                        # Sprint / Task / Status 等型別
├── config/
│   ├── teams.ts                    # Owner → Team 對照（主管 / 前台 / 後台 / 未分配）
│   └── holidays.ts                 # 台灣國定假日（目前 2026）
├── hooks/
│   ├── useSprints.ts               # localStorage CRUD
│   └── useTasks.ts                 # localStorage CRUD（含 deleteTasksBySprint 連動刪）
├── utils/
│   ├── date.ts                     # totalDays / sprintProgress / countWorkdays / isRestDay...
│   └── importTasks.ts              # CSV/XLSX → ParsedRow[]（SheetJS + zod 逐列驗證）
├── components/
│   ├── SprintForm / SprintCard / SprintList
│   ├── TaskForm / TaskRow / TaskList / TaskTimeline
│   ├── StatusPill / ProgressBar / MilestoneChip / MilestoneEditModal / ViewToggle
│   └── ImportTasksModal            # 匯入流程 UI：idle → parsing → preview → done
└── pages/
    ├── SprintListPage.tsx
    └── SprintDetailPage.tsx
```

`public/task-template.csv` 是使用者下載用的範本檔（header 跟 `importTasks.ts` 的 `HEADERS` 對齊）。

---

## 專案慣例

### 1. UI：所有可點擊元素都要是手指游標

Tailwind Preflight 會把 `<button>` 的 cursor reset 成 `inherit`。本專案在 `src/index.css` 的 `@layer base` 加了全域規則：

```css
button:not(:disabled),
[role="button"]:not([aria-disabled="true"]) {
  cursor: pointer;
}
```

**因此：**
- 新寫 button **不需要**再加 `cursor-pointer` className，base 規則會套用
- 若用 `<div>` / `<a>` / `<span>` 裝 `onClick`，請加 `role="button"`（或乾脆改用 `<button>`）
- disabled / aria-disabled 狀態保留 default cursor，不要刻意蓋掉（a11y）

### 2. 新增任務狀態
`TaskStatus` 順序：`待辦 → 開發中 → 測試中 → ready to prod → 已完成`（定義在 `src/types.ts`）。新狀態加在這個順序中。對應配色要同步更新：
- `src/components/StatusPill.tsx` 的 `statusStyles`（pill 淡色）
- `src/components/TaskTimeline.tsx` 的 `statusBarClass`（timeline bar 實色）

### 3. 新增 Owner 或改組別
改 `src/config/teams.ts` 的 `OWNER_TEAM` map。時間軸會自動以 `TEAMS` 順序分組、組間插入分隔列。

### 4. 新增國定假日
改 `src/config/holidays.ts`。時間軸 header 會自動紅字 + hover 顯示假日名稱。`countWorkdays` 也會自動扣掉。

### 5. 里程碑
Sprint 層級的可選里程碑欄位（見 `types.ts`）：`finalTestDate` / `regressionStartDate` / `regressionEndDate` / `releaseDate`。
- `regressionStartDate` 和 `regressionEndDate` 現在是**兩個獨立的使用者欄位**（早期版本是硬編 +2 天，已改成可自填）；`regressionEndDate` 無值時 render 端 fallback 用 `regressionStartDate + 1`。
- **不在** SprintForm 裡編輯（刻意拿掉：新增 sprint 當下不會知道這些日期）
- **在** SprintDetailPage sprint header 卡片的 chip + `MilestoneEditModal` 編輯
- 時間軸上顯示為垂直色帶 + 豎排全名文字（z-index 1），任務 bar（z-index 10）會蓋過色帶文字

### 6. Sprint 刪除連動清任務
在 `SprintListPage` 的 `handleDelete` 裡：`deleteTasksBySprint(id)` 再 `deleteSprint(id)`。未來接 Supabase 後可用 foreign key cascade，這段 JS 就可以拿掉。

### 7. 任務匯入（CSV / XLSX）
`utils/importTasks.ts` 用 SheetJS（`xlsx` 套件）統一讀 CSV / XLSX，搭 zod 做逐列驗證。關鍵慣例：
- **同一支 parser 吃兩種格式**：`XLSX.read` 對 CSV 字串 / XLSX ArrayBuffer 都吃；CSV 必須先 `file.text()` decode 成 UTF-8 字串，不然 SheetJS 會用 Latin-1 解 bytes、中文 header 全亂碼。
- **header 名是中文**，集中在 `HEADERS` 常數（`標題` / `Owner` / `狀態` / `開始日期` / `結束日期` / `BE 交付日期`）。改 header 要同時改 `task-template.csv`。
- **錯誤策略**：每列獨立驗證，不因為某列爛就整份放棄。回傳 `ParsedRow[]`（`ok: true | false` 的 union）讓 Modal 列出有效/無效列，使用者按「匯入有效列」只送 `ok: true` 的部分。
- **BE 交付日期**是任務層級欄位（`Task.beApiDeliveryDate`），匯入有支援；時間軸會把任務條切兩段（左段等 API 中、斜條紋；右段收到 API 後、實色）。
- **日期格式寬鬆**：CSV 接 `yyyy-mm-dd` / `yyyy/mm/dd` / `yyyy.mm.dd`；XLSX 的日期 cell 透過 `cellDates: true` 轉 `Date` 物件後取 UTC 組字串（避開時區偏移、跟專案其他地方對齊）。

---

## Dev 指令

```bash
cd /Users/vita/Desktop/vita_project/sprint-progress-bar
npm run dev        # Vite dev server
npx tsc --noEmit   # 型別檢查
```

Claude Code 裡用 `mcp__Claude_Preview__preview_start` with name `sprint-progress-bar` 可以直接啟動預覽面板。

---

## 暫未做（未來階段）

- 接 Supabase（多人共用、跨裝置）；部署走 Zeabur 靜態前端（build `npm run build` → `dist/`，環境變數 `VITE_SUPABASE_*` 前綴；RLS 是真正的資安邊界，不要依賴 anon key 保密）
- BE / FE / BA / QA 人名分欄（目前 Task 只有單一 `owner: string`，要拆成多角色欄位才能支援跨職能任務）
- 全年行事曆（PM Leader 才需要，暫不加以免失焦）
