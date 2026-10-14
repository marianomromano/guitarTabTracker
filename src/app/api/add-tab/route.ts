import { NextResponse } from "next/server";
import { addTab } from "@/app/actions";
import { addErrorCode } from "@/lib/add-errors";
import { requestOrigin, safeReturnPath, withQuery } from "@/lib/safe-path";

export async function POST(request: Request) {
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "");
  const artist = String(formData.get("artist") ?? "");
  const collectionRaw = String(formData.get("collectionId") ?? "");
  const collectionId = Number(collectionRaw);
  const instruments = formData.getAll("instruments").map(String);
  const returnTo = safeReturnPath(String(formData.get("returnTo") ?? ""), "/search");
  const base = requestOrigin(request);

  const result = await addTab({
    title,
    artist,
    collectionId: Number.isFinite(collectionId) && collectionId > 0 ? collectionId : undefined,
    instruments,
  });

  if (result.ok) {
    return NextResponse.redirect(new URL(result.tabHref, base), 303);
  }

  const code =
    "needsAlbumPick" in result && result.needsAlbumPick
      ? "pick"
      : addErrorCode("error" in result ? result.error : "Could not add that tab.");
  return NextResponse.redirect(new URL(withQuery(returnTo, "addError", code), base), 303);
}
