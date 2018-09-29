export function nap(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 100));
}
