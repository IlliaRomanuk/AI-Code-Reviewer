export interface ReviewComment {
  filename: string;
  /** Номер строки в новой версии файла (side: RIGHT). Undefined = комментарий к файлу целиком. */
  line?: number;
  /** Сам комментарий: краткая суть + объяснение "почему так лучше". */
  body: string;
}
