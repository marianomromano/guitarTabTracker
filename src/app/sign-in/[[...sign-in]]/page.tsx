import { PasswordSignIn } from "@/components/password-sign-in";
import { startDemoAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { isClerkConfigured } from "@/lib/auth-config";

export default function SignInPage() {
  if (!isClerkConfigured()) {
    return (
      <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-[11px] tracking-[0.28em] text-gold uppercase">Save your shelf</p>
        <h1 className="font-heading mt-2 text-2xl">Sign-in is not connected yet</h1>
        <p className="mt-2 text-muted-foreground">
          You can still try TabShelf in demo mode. Once sign-in is enabled, your
          shelf can follow you across devices.
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
      <PasswordSignIn />
    </div>
  );
}
