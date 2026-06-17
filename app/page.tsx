import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Svadba Plus — платформа для свадебных агентств",
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-3xl">
        {/* Шапка-бренд */}
        <div className="text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full border border-gold font-heading text-3xl text-gold">
            S
          </div>
          <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
            Svadba&nbsp;Plus
          </div>
          <h1 className="mt-3 text-4xl font-semibold leading-[1.1] md:text-5xl">
            Платформа для
            <br />
            <span className="font-normal italic text-gold">свадебных агентств</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] text-muted-foreground">
            Управление свадьбами, чек-листы, бюджет и тайминг — и личный кабинет
            для пары, которого нет у конкурентов.
          </p>
        </div>

        {/* Две карточки входа */}
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <EntryCard
            eyebrow="Для профессионалов"
            title="Агентство"
            description="Вход для свадебных координаторов и команды агентства."
            href="/login"
            cta="Войти в агентство"
            variant="gold"
          />
          <EntryCard
            eyebrow="Для молодожёнов"
            title="Кабинет пары"
            description="Ваша свадьба, гости, тайминг и запросы — вход по телефону и паролю от агентства."
            href="/couple/login"
            cta="Войти как пара"
            variant="outline"
          />
        </div>

        {/* Дискретный вход администратора */}
        <div className="mt-14 text-center">
          <Link
            href="/super-admin/login"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 transition-colors hover:text-gold"
          >
            Вход для администратора →
          </Link>
        </div>
      </div>
    </main>
  );
}

function EntryCard({
  eyebrow,
  title,
  description,
  href,
  cta,
  variant,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  variant: "gold" | "outline";
}) {
  return (
    <div className="group flex flex-col rounded-2xl border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold-soft hover:shadow-md">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
        {eyebrow}
      </div>
      <h2 className="mt-2 font-heading text-2xl">{title}</h2>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
      <Link
        href={href}
        className={`${buttonVariants({ variant })} mt-6 w-full`}
      >
        {cta}
      </Link>
    </div>
  );
}
