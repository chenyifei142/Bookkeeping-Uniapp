/**
 * 格式化金额显示
 * 将数字转换为带千分位的格式
 * @param {number|undefined|null} amount - 需要格式化的金额
 * @returns {string} - 格式化后的金额字符串
 */
export const formatAmount = (amount) => {
  if (amount === undefined || amount === null) return '0';
  
  const num = Number(amount);
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

/**
 * 带货币符号的金额格式化
 * @param {number|undefined|null} amount - 需要格式化的金额
 * @param {string} symbol - 货币符号，默认为 '¥'
 * @returns {string} - 带货币符号的格式化金额
 */
export const formatCurrency = (amount, symbol = '¥') => {
  if (amount === undefined || amount === null) return `${symbol}0`;
  return `${symbol}${formatAmount(amount)}`;
}; 