import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface PagePlaceholderProps {
  title: string;
  subtitle: string;
  description: string;
}

export function PagePlaceholder({
  title,
  subtitle,
  description,
}: PagePlaceholderProps) {
  return (
    <>
      <Header title={title} subtitle={subtitle} />
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              <Sparkles className="size-5 text-[var(--color-muted-foreground)]" />
            </div>
            <h2 className="text-lg font-semibold">Em construção</h2>
            <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">
              {description}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
