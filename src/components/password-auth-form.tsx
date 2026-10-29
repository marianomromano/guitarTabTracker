import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PasswordAuthForm({
  mode,
  error,
}: {
  mode: "sign-in" | "sign-up";
  error?: string | null;
}) {
  return (
    <form
      action={mode === "sign-in" ? "/api/sign-in" : "/api/sign-up"}
      method="post"
      className="mx-auto w-full max-w-sm space-y-4"
    >
      <label className="block space-y-1.5">
        <span className="text-sm text-muted-foreground">Email</span>
        <Input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          className="h-12 text-base md:h-12 md:text-base"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-muted-foreground">Password</span>
        <Input
          type="password"
          name="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={8}
          required
          className="h-12 text-base md:h-12 md:text-base"
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        type="submit"
        className="h-12 w-full bg-gold text-base text-black hover:bg-gold/90 md:h-12"
      >
        {mode === "sign-in" ? "Sign in" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "sign-in" ? (
          <>
            No account yet?{" "}
            <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
