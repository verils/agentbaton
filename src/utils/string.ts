/**
 * 判断字符是否为全角字符（CJK 字符、全角标点等，终端占 2 列宽度）
 */
function isFullwidthChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    // CJK 统一汉字
    (code >= 0x4e00 && code <= 0x9fff) ||
    // CJK 统一汉字扩展 A
    (code >= 0x3400 && code <= 0x4dbf) ||
    // CJK 兼容汉字
    (code >= 0xf900 && code <= 0xfaff) ||
    // CJK 部首补充
    (code >= 0x2e80 && code <= 0x2eff) ||
    // CJK 笔画
    (code >= 0x31c0 && code <= 0x31ef) ||
    // CJK 标点符号
    (code >= 0x3000 && code <= 0x303f) ||
    // 全角 ASCII / 全角标点
    (code >= 0xff01 && code <= 0xff60) ||
    // 全角符号
    (code >= 0xffe0 && code <= 0xffe6) ||
    // 韩文
    (code >= 0xac00 && code <= 0xd7af) ||
    // 平假名 / 片假名
    (code >= 0x3040 && code <= 0x309f) ||
    (code >= 0x30a0 && code <= 0x30ff)
  );
}

/**
 * 计算字符串的终端显示宽度（半角字符 = 1，全角字符 = 2）
 */
export function getStringWidth(str: string): number {
  let width = 0;
  for (const char of str) {
    width += isFullwidthChar(char) ? 2 : 1;
  }
  return width;
}

/**
 * 按显示宽度右填充空格，使字符串达到目标显示宽度
 *
 * @example
 * padEndWidth('你好', 10)    // '你好      '  (2 全角 + 6 空格 = 10 列)
 * padEndWidth('hello', 10)   // 'hello     '  (5 半角 + 5 空格 = 10 列)
 */
export function padEndWidth(str: string, targetWidth: number): string {
  const currentWidth = getStringWidth(str);
  const padding = Math.max(0, targetWidth - currentWidth);
  return str + ' '.repeat(padding);
}
