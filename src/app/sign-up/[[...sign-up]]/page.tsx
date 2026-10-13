import { ClerkLoaded, ClerkLoading, SignUp } from "@clerk/nextjs";
import { startDemoAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/auth-config";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Save your shelf</p>
        <h1 className="font-heading mt-2 text-2xl">Accounts are not connected yet</h1>
        <p className="mt-2 text-muted-foreground">
          Try the demo to search tabs and build a shelf on this device.
        </p>
        <form action={startDemoAction} className="mt-6">
          <Button type="submit" className="bg-gold text-black hover:bg-gold/90">
            Continue with the demo
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-24">
      <ClerkLoading>
        <p className="text-sm text-muted-foreground">Loading sign up…</p>
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp
          appearance={clerkAppearance}
          routing="path"
          path="/sign-up"
          fallbackRedirectUrl="/library"
          forceRedirectUrl="/library"
          signInUrl="/sign-in"
        />
      </ClerkLoaded>
    </div>
  );
}
