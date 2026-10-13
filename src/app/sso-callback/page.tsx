import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SsoCallbackPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24 text-sm text-muted-foreground">
      <AuthenticateWithRedirectCallback />
      Finishing sign in…
    </div>
  );
}
