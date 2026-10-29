import { redirect } from "next/navigation";
import { PasswordAuthForm } from "@/components/password-auth-form";
import { getSession } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const session = await getSession();
  if (session.isSignedIn) {
    redirect("/library");
  }

  const params = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16">
      <p className="text-[11px] tracking-[0.28em] text-primary uppercase">Save your shelf</p>
      <h1 className="font-heading mt-2 text-2xl">Sign in</h1>
      <p className="mt-2 mb-6 text-center text-sm text-muted-foreground">
        Use the email and password you created for TabShelf.
      </p>
      {params.notice === "confirm" ? <p role="status" className="mb-4 text-center text-sm text-primary">Check your email to confirm your account, then sign in.</p> : null}
      <PasswordAuthForm mode="sign-in" error={authErrorMessage(params.error)} />
    </div>
  );
}
