export const ADD_ERRORS = {
  save: "Could not save that album. Try again.",
  compile: "That release looks like a compilation. Try another album version.",
  match: "Could not match that song to a track on the album.",
  empty: "That album has no tracks in iTunes.",
  pick: "Pick another version of that song and try again.",
  part: "Could not add that part. Try again.",
} as const;

export type AddErrorCode = keyof typeof ADD_ERRORS;

export function addErrorMessage(code: string | undefined) {
  if (!code || !(code in ADD_ERRORS)) return null;
  return ADD_ERRORS[code as AddErrorCode];
}

export function addErrorCode(error: string) {
  if (error.includes("compilation")) return "compile";
  if (error.includes("match")) return "match";
  if (error.includes("no tracks")) return "empty";
  return "save";
}
