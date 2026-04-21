import { validateTargetUrl } from '../lib/urlGuard';

export async function secureUrl(input: string): Promise<string> {
  const parsed = await validateTargetUrl(input);
  return parsed.toString();
}
