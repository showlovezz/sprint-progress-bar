export type Sprint = {
  id: string;
  code: string;
  startDate: string;
  endDate: string;
  /** PM 里程碑 */
  finalTestDate?: string;        // QA 最後進測日（單日）
  regressionStartDate?: string;  // 回歸測試開始
  regressionEndDate?: string;    // 回歸測試結束（使用者自填；無值時 render 端 fallback 用 start+1）
  releaseDate?: string;          // 全站更新（單日）
  createdAt: string;
};

export type SprintInput = Omit<Sprint, 'id' | 'createdAt'>;

export const TASK_STATUSES = [
  '待辦',
  '開發中',
  '測試中',
  'ready to prod',
  '已完成',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Task = {
  id: string;
  sprintId: string;
  title: string;
  status: TaskStatus;
  /** PM（原本叫 owner；公司 Excel 的 Owner 欄位語意是 PM） */
  pm?: string;
  /** 多人角色 — 以第一個 feOwner 作為時間軸分組依據（teams.ts 的 OWNER_TEAM 查這個） */
  beOwners?: string[];
  feOwners?: string[];
  baOwners?: string[];
  qaOwners?: string[];
  startDate?: string;   // ISO yyyy-mm-dd；沒填 = 無日期（時間軸不顯示）
  endDate?: string;
  /** BE 交付 API 日期 = 後端預計完成日期（公司 Excel 那邊的命名）。設了會把時間軸任務條切兩段：
   *  左段（等 API 中，斜條紋）/ 右段（收到 API 後，實色）。 */
  beApiDeliveryDate?: string;
  /** 前端預計完成日期 */
  feExpectedCompleteDate?: string;
  /** 預計進測日期 */
  plannedQaDate?: string;
  /** 實際進測日期 */
  actualQaDate?: string;
  /** Jira 票號（不含 base URL；base 在專案 config）例：TKW-22313 */
  jiraKey?: string;
  createdAt: string;
};

export type TaskInput = Omit<Task, 'id' | 'createdAt'>;
