import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signIn } from "@/auth";

function GitHubMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      aria-hidden
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.28-1.67-1.28-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.43-2.7 5.41-5.27 5.69.41.36.78 1.06.78 2.13 0 1.54-.01 2.79-.01 3.17 0 .31.21.68.8.56 4.56-1.53 7.85-5.83 7.85-10.9C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

interface SignInPageProps {
  searchParams: Promise<{ from?: string; error?: string }>;
}

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { from, error } = await searchParams;
  const redirectTo = from && from.startsWith("/") ? from : "/";

  async function signInWithGitHub() {
    "use server";
    await signIn("github", { redirectTo });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-6 p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
              <span className="text-lg font-bold">N</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Entrar no Notedo
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Estude com foco. Sua jornada começa aqui.
            </p>
          </div>

          <form action={signInWithGitHub}>
            <Button type="submit" className="w-full gap-2">
              <GitHubMark />
              Continuar com GitHub
            </Button>
          </form>

          {error && (
            <p className="text-xs text-rose-300">
              Não foi possível entrar. Tente novamente.
            </p>
          )}

          <p className="text-xs text-[var(--color-muted-foreground)]">
            Ao continuar, você concorda com os termos do GitHub OAuth. Você pode
            sair a qualquer momento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
