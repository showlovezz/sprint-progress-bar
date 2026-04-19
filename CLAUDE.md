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
│   └── date.ts                     # totalDays / sprintProgress / countWorkdays / isRestDay...
├── components/
│   ├── SprintForm / SprintCard / SprintList
│   ├── TaskForm / TaskRow / TaskList / TaskTimeline
│   ├── StatusPill / ProgressBar / MilestoneChip / MilestoneEditModal / ViewToggle
└── pages/
    ├── SprintListPage.tsx
    └── SprintDetailPage.tsx
```

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
Sprint 層級有 3 個可選里程碑：`finalTestDate` / `regressionStartDate`（2 天）/ `releaseDate`。
- **不在** SprintForm 裡編輯（刻意拿掉：新增 sprint 當下不會知道這些日期）
- **在** SprintDetailPage sprint header 卡片的 3 個 chip + `MilestoneEditModal` 編輯
- 時間軸上顯示為垂直色帶 + 豎排全名文字（z-index 1），任務 bar（z-index 10）會蓋過色帶文字

### 6. Sprint 刪除連動清任務
在 `SprintListPage` 的 `handleDelete` 裡：`deleteTasksBySprint(id)` 再 `deleteSprint(id)`。未來接 Supabase 後可用 foreign key cascade，這段 JS 就可以拿掉。

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

- Excel / CSV 匯入（使用者有需要，30+ 任務手 key 太累）
- 接 Supabase（多人共用、跨裝置）
- BE / FE / BA / QA 人名分欄、任務層級的 BE 交付 API 日期
- 全年行事曆（PM Leader 才需要，暫不加以免失焦）
