/** JSON embedded in HTML must not be able to close its script element. */
export function serializeStructuredData(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, char =>
    `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`);
}
