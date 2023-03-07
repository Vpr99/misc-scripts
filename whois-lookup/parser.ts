import { parse as _parse } from "csv-parse";

/**
 * Parses a CSV into an array of objects, keyed by the header row contents.
 */
export async function parse(
  csvString: string
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    _parse(
      csvString,
      { columns: true },
      (err, rows: Record<string, unknown>[]) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      }
    );
  });
}
