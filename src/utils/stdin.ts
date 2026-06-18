/**
 * 安装进程级 stdin 恢复钩子。
 *
 * @clack/core 的 Prompt 在 Windows 上存在以下缺陷：
 *  1. close() 中 setRawMode(false) 无 try-catch，抛异常会导致 stdin 永久卡在 rawMode
 *  2. onKeypress 中 render() 无 try-catch，抛异常会跳过 close()，stdin 同样卡死
 *  3. block() 的清理函数在 Windows 上跳过 setRawMode(false)
 *
 * 本模块通过进程信号和 exit 钩子确保 stdin 在任何退出路径下都能恢复到正常模式。
 */
export function installStdinRecovery(): void {
  const stdin = process.stdin;

  function restoreStdin() {
    try {
      if (stdin.isTTY && typeof stdin.setRawMode === 'function') {
        stdin.setRawMode(false);
      }
    } catch {
      // 忽略：stdin 可能已关闭
    }
  }

  process.on('exit', restoreStdin);
  process.on('SIGINT', () => {
    restoreStdin();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    restoreStdin();
    process.exit(143);
  });
  process.on('uncaughtException', (err) => {
    restoreStdin();
    console.error(err);
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
    restoreStdin();
    console.error(err);
    process.exit(1);
  });
}
