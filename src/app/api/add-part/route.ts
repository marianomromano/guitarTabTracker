import { NextResponse } from "next/server";
import { addPartAction } from "@/app/actions";
import { requestOrigin, safeReturnPath, withQuery } from "@/lib/safe-path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const trackId = String(formData.get("trackId") ?? "");
  const instrument = String(formData.get("instrument") ?? "guitar");
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? ""), "/library");
  const base = requestOrigin(request);

  const result = await addPartAction({ trackId, instrument });
  if (result.ok) {
    return NextResponse.redirect(new URL(result.tabHref, base), 303);
  }

  return NextResponse.redirect(new URL(withQuery(returnTo, "addError", "part"), base), 303);
}
