/**
 * Run N async tasks with at most `concurrency` in-flight at once.
 * Returns results in the same order as the input tasks array.
 */
export async function withConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number = 10
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;

  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, worker)
  );

  return results;
}
