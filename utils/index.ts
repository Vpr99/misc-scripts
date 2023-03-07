import { exec } from "child_process";

/** zzz */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Promise wrapper for `child_process.exec` to run shell commands. */
export function run(cmd: string, timeout = 2000): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout }, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) return reject(stderr);
      resolve(stdout);
    });
  });
}
