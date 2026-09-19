/** Local HTTP on a phone has no Clipboard API. Keep copying usable through the legacy browser fallback. */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { /* Fall back when permissions or secure-context rules block the modern API. */ }
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  try { return document.execCommand("copy"); }
  catch { return false; }
  finally { input.remove(); }
}
