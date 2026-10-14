import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { addPartAction } from "@/app/actions";
import { requestOrigin, safeReturnPath, withQuery } from "@/lib/safe-path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const trackId = String(formData.get("trackId") ?? "");
  const instrument = String(formData.get("instrument") ?? "guitar");
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? ""), "/library");
  const base = requestOrigin(request);
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;

  const result = await addPartAction({ trackId, instrument });
  if (wantsJson) {
    if (result.ok) {
      revalidatePath(returnTo);
      return NextResponse.json({ ok: true, tabHref: result.tabHref, tabId: result.tabId });
    }
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  if (result.ok) {
    revalidatePath(returnTo);
    return NextResponse.redirect(new URL(returnTo, base), 303);
  }

  return NextResponse.redirect(new URL(withQuery(returnTo, "addError", "part"), base), 303);
}
