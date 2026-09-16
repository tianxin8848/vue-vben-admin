import { onMounted, onUnmounted, ref } from 'vue';

import { $t } from '#/locales';

const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

/** 当前 UTC+8 时刻 → `YYYY-MM-DD HH:mm:ss 周几` */
function formatUTC8Now(): string {
  const utc8 = new Date(Date.now() + 8 * 3600 * 1000);
  const weekLabels = WEEK_KEYS.map(
    (k) => $t(`page.leave.calendarView.weekdays.${k}`) as string,
  );
  const y = utc8.getUTCFullYear();
  const m = String(utc8.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc8.getUTCDate()).padStart(2, '0');
  const hh = String(utc8.getUTCHours()).padStart(2, '0');
  const mm = String(utc8.getUTCMinutes()).padStart(2, '0');
  const ss = String(utc8.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss} ${weekLabels[utc8.getUTCDay()]}`;
}

/**
 * UTC+8 实时时钟：挂载后每秒刷新，卸载自动清理定时器。
 * 时区基准与日历取日逻辑保持一致（均为 UTC+8）。
 */
export function useLiveClock() {
  const currentTime = ref('');

  let timer: null | number = null;

  function tick() {
    currentTime.value = formatUTC8Now();
  }

  onMounted(() => {
    tick();
    timer = window.setInterval(tick, 1000);
  });

  onUnmounted(() => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  });

  return { currentTime };
}
