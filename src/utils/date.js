/**
 * 格式化日期显示
 * @param {string} dateStr - 日期字符串
 * @returns {string} 格式化后的日期显示
 */
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';

  // 解析日期字符串为日期对象
  const consumptionDate = new Date(dateStr);
  // 获取当前日期（不含时分秒）
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 计算日期差异（天数）
  const timeDiff = Math.floor((consumptionDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  // 获取月份和日期
  const month = consumptionDate.getMonth() + 1;
  const day = consumptionDate.getDate();
  const datePrefix = `${month}月${day}日`;

  // 根据与今天的差异返回不同的文本
  switch (timeDiff) {
    case -2:
      return `${datePrefix} 前天`;
    case -1:
      return `${datePrefix} 昨天`;
    case 0:
      return `${datePrefix} 今天`;
    case 1:
      return `${datePrefix} 明天`;
    case 2:
      return `${datePrefix} 后天`;
    default:
      // 获取星期几
      const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
      const weekday = weekdays[consumptionDate.getDay()];
      return `${datePrefix} 周${weekday}`;
  }
};

/**
 * 格式化当前月份为YYYY-MM格式
 * @returns {string} 格式化后的月份
 */
export const formatCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * 格式化指定年月为YYYY-MM格式
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {string} 格式化后的月份
 */
export const formatYearMonth = (year, month) => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

/**
 * 计算当月剩余天数
 * @returns {number} 剩余天数（包含今天）
 */
export const getRemainingDays = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0).getDate();
  // 当前日期
  const currentDay = today.getDate();
  // 剩余天数（包含今天）
  return lastDay - currentDay + 1;
};

/**
 * 格式化显示月份范围
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {string} 格式化后的月份范围
 */
export const formatMonthRange = (year, month) => {
  // 获取当月第一天和最后一天
  const lastDay = new Date(year, month, 0);
  const startDate = `${month}月1日`;
  const endDate = `${month}月${lastDay.getDate()}日`;
  return `${startDate} - ${endDate}`;
}; 