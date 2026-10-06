export const demoEnabled = true;

export async function schoolApi<T>(): Promise<T> {
  throw new Error('The local prototype uses sample data. Backend access is disabled.');
}
