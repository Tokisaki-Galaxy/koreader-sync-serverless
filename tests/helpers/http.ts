export function getCookieHeaderFromResponse(res: Response, cookieName: string): string {
  const setCookie = res.headers.get("set-cookie") ?? "";
  const pair = setCookie.split(";")[0];
  if (!pair.startsWith(`${cookieName}=`)) {
    throw new Error(`Cookie ${cookieName} not found in response`);
  }
  return pair;
}
