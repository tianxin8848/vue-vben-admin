import { ElMessage } from 'element-plus';

/**
 * 消息提示的统一出口。
 *
 * 为什么不直接调 ElMessage：
 * 1. `grouping` 统一打开，避免同一操作连点多次堆出多条相同提示（element-plus 默认是 false）。
 * 2. 与 `api/request.ts` 里的 `errorMessageResponseInterceptor` 形成明确分工——
 *    请求类错误由拦截器统一弹出，业务 catch 块不应再弹一次，否则一次失败会出现两条不同报错。
 *    这个分工由 `handleActionError` 落地。
 *
 * 用法：
 * - 成功/警告/本地校验失败：`toastSuccess(msg)` / `toastWarning(msg)` / `toastError(msg)`
 * - catch 到错误：一律走 `handleActionError(scope, error, fallbackMessage?)`
 */

/**
 * 是否为「请求类错误」。
 *
 * axios 抛出的错误对象带 `isAxiosError: true` 与 `response`（网络错误时 response 为空对象）。
 * 用它区分「接口失败」与「本地校验/数据解析失败」，前者拦截器已提示、后者需要自己提示。
 */
export function isRequestError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { isAxiosError?: boolean; response?: unknown };
  return err.isAxiosError === true || err.response !== undefined;
}

/** 成功提示 */
export function toastSuccess(message: string): void {
  ElMessage.success({ grouping: true, message });
}

/** 警告提示（本地校验未通过等） */
export function toastWarning(message: string): void {
  ElMessage.warning({ grouping: true, message });
}

/**
 * 错误提示。
 * 注意：接口失败请改用 `handleActionError`，否则会和响应拦截器的提示重复弹出。
 */
export function toastError(message: string): void {
  ElMessage.error({ grouping: true, message });
}

/**
 * catch 块的统一出口，替代 `console.error(...) + ElMessage.error(...)` 的样板。
 *
 * 行为：
 * - 请求类错误：`errorMessageResponseInterceptor` 已经弹过（且用的是后端返回的具体信息，通常更准），
 *   这里只写 console，不再弹第二次。
 * - 非请求类错误：拦截器不会提示，这里补一次 `fallbackMessage`，避免错误被静默吞掉。
 *
 * @param scope 日志前缀，形如 `'employees/list'`、`'claim/submit'`，便于定位来源
 * @param error catch 到的原始错误
 * @param fallbackMessage 非请求类错误的兜底提示；省略则只记日志
 *
 * @example
 * ```ts
 * try {
 *   await updateEmployeeStatusApi(id, active);
 *   toastSuccess(t('page.employees.message.statusUpdateSuccess'));
 * } catch (error) {
 *   handleActionError('employees/list', error);
 * }
 * ```
 */
export function handleActionError(
  scope: string,
  error: unknown,
  fallbackMessage?: string,
): void {
  console.error(`[${scope}]`, error);
  if (isRequestError(error)) {
    return;
  }
  if (fallbackMessage) {
    toastError(fallbackMessage);
  }
}
