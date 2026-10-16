"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/app/icons";
import { Notice } from "@/components/app/Notice";
import { newEventId, track } from "@/lib/analytics";
import { toBrazilE164 } from "@/lib/phone";
import { AI_SITE_FEE_LABEL, platformName, PUBLISH_FEE_LABEL } from "@/lib/platform-data";
import { createClient } from "@/lib/supabase/client";
import { TEMPLATE_CHOICES } from "@/lib/template-options";
import { reportSignupFailureAction } from "./actions";

/** Veio do "Site feito pela IA" da landing (?ia=1): depois do cadastro, vai para o briefing. */
function wantsAi() {
  return new URLSearchParams(window.location.search).get("ia") === "1";
}

/** Modelo escolhido na landing (?modelo=<id>). Só vale id oferecido no seletor. */
function chosenTemplate() {
  const id = new URLSearchParams(window.location.search).get("modelo");
  return TEMPLATE_CHOICES.find((choice) => choice.id === id);
}

const POINTS: { icon: IconName; text: string }[] = [
  { icon: "eye", text: "Vocês veem o site pronto antes de pagar qualquer coisa." },
  { icon: "edit", text: "Modelo, textos e fotos mudam quando quiserem." },
  { icon: "pix", text: "Presentes via Pix caem direto na conta de vocês, sem taxa." }
];

const labelText = "text-sm font-medium text-ink";
const hintText = "text-[0.8125rem] leading-5 text-ink-soft";
// 16px no input: abaixo disso o iOS (inclusive o navegador do Instagram) dá zoom no foco.
const inputClass = "field min-h-12 text-base";
const textLink =
  "font-semibold text-ink underline underline-offset-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappInvalid, setWhatsappInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [template, setTemplate] = useState<(typeof TEMPLATE_CHOICES)[number]>();
  const [ai, setAi] = useState(false);

  // Lido no navegador (sem useSearchParams): a página segue estática, sem Suspense.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplate(chosenTemplate());
    setAi(wantsAi());
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    // O nome vira o casamento criado automaticamente no /onboarding.
    if (name.trim().length < 3) {
      setError("Informe o nome do casal.");
      return;
    }

    // Vai para a conta (profiles.whatsapp), nunca para o site: o /onboarding grava.
    const whatsappE164 = toBrazilE164(whatsapp);
    if (!whatsappE164) {
      setWhatsappInvalid(true);
      setError("Confira o WhatsApp: DDD + número, como (11) 91234-5678.");
      document.getElementById("cadastro-whatsapp")?.focus();
      return;
    }

    if (password.length < 8) {
      setError("A senha precisa ter ao menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    // O modelo vai no user_metadata; o servidor valida de novo antes de criar o site.
    const templateId = chosenTemplate()?.id;
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim(), whatsapp: whatsappE164, ...(templateId ? { template: templateId } : {}) }
      }
    });

    if (signUpError) {
      // Só o código do Supabase, para o funil; não segura a tela.
      void reportSignupFailureAction(signUpError.code ?? "unknown").catch(() => {});
      setError(
        signUpError.message.toLowerCase().includes("already")
          ? "Já existe uma conta com esse email. Tente entrar."
          : "Não foi possível criar a conta. Tente novamente."
      );
      setLoading(false);
      return;
    }

    // Confirmação de email habilitada: ainda não há sessão.
    if (!data.session) {
      setNotice("Conta criada! Confirme o email que enviamos para continuar.");
      setLoading(false);
      return;
    }

    // Há sessão: cria o perfil (RLS exige id = auth.uid()).
    if (data.user) {
      await supabase
        .from("profiles")
        .upsert(
          { id: data.user.id, email: data.user.email ?? null, name: name.trim() || null },
          { onConflict: "id", ignoreDuplicates: true }
        );
    }

    // Conta criada: o /onboarding fecha o cadastro no servidor (funil + Conversions
    // API com o mesmo eventId) e cria o site; o botão segue carregando até lá.
    setPreparing(true);
    const eventId = newEventId("signup");
    track("sign_up", { method: "email" }, { eventId });
    router.replace(`/onboarding?cadastro=${encodeURIComponent(eventId)}${wantsAi() ? "&ia=1" : ""}`);
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* Conteúdo do cabeçalho na mesma coluna de 6xl do <main>; só a hairline vai de ponta a ponta. */}
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" className="font-serif text-[1.75rem] italic leading-none">
            {platformName}
          </Link>
          <p className="text-sm text-ink-soft">
            Já tem conta?{" "}
            <Link href="/login" className={`inline-flex min-h-11 items-center px-1 ${textLink}`}>
              Entrar
            </Link>
          </p>
        </div>
      </header>

      {/* Mobile: título, formulário e só depois os argumentos. Desktop: formulário à direita. */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 pt-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10 lg:py-16">
        <div className="hero-rise">
          <h1 className="font-serif text-[2.25rem] leading-[1.05] tracking-[-0.015em] text-balance md:text-[3.25rem]">
            O site de <em>vocês</em> começa aqui
          </h1>
          <p className="mt-3 max-w-md text-base leading-7 text-ink-soft">
            Grátis para montar e ver o site pronto. Vocês só pagam{" "}
            <strong className="font-semibold whitespace-nowrap text-ink">{ai ? AI_SITE_FEE_LABEL : PUBLISH_FEE_LABEL}</strong>{" "}
            se decidirem publicar{ai ? ", com o site montado pela IA" : ""}.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="panel hero-rise grid gap-5 p-5 [animation-delay:60ms] sm:p-7 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          {template ? (
            <p className="flex items-center gap-3 rounded-lg bg-bg-2 px-3.5 py-3 text-sm leading-5 text-ink">
              <span aria-hidden className="flex shrink-0 -space-x-1.5">
                {template.swatch.map((color) => (
                  <span key={color} className="size-4 rounded-full border border-line-strong" style={{ background: color }} />
                ))}
              </span>
              <span>
                Modelo escolhido: <strong className="font-semibold">{template.label}</strong>. Dá para trocar depois.
              </span>
            </p>
          ) : null}

          <div className="grid gap-1.5">
            <label htmlFor="cadastro-nome" className={labelText}>
              Nome do casal
            </label>
            <input
              id="cadastro-nome"
              type="text"
              required
              minLength={3}
              autoComplete="off"
              placeholder="Helena & Lucas"
              aria-describedby="cadastro-nome-dica"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClass}
            />
            <p id="cadastro-nome-dica" className={hintText}>
              Aparece no topo do site. Dá para mudar depois.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="cadastro-email" className={labelText}>
              Email
            </label>
            <input
              id="cadastro-email"
              type="email"
              inputMode="email"
              required
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="cadastro-whatsapp" className={labelText}>
              WhatsApp com DDD
            </label>
            <input
              id="cadastro-whatsapp"
              type="tel"
              inputMode="tel"
              required
              autoComplete="tel-national"
              placeholder="(11) 91234-5678"
              aria-describedby="cadastro-whatsapp-dica"
              aria-invalid={whatsappInvalid || undefined}
              value={whatsapp}
              onChange={(event) => {
                setWhatsapp(event.target.value);
                setWhatsappInvalid(false);
              }}
              className={inputClass}
            />
            <p id="cadastro-whatsapp-dica" className={hintText}>
              Só para falarmos com vocês sobre o site e o pagamento. Não aparece no site.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="cadastro-senha" className={labelText}>
              Senha
            </label>
            <input
              id="cadastro-senha"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-describedby="cadastro-senha-dica"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
            />
            <p id="cadastro-senha-dica" className={hintText}>
              Mínimo de 8 caracteres.
            </p>
          </div>

          {error ? <Notice tone="error">{error}</Notice> : null}
          {notice ? <Notice tone="success">{notice}</Notice> : null}

          <div className="grid gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-sm btn-primary min-h-12 w-full text-base disabled:opacity-60"
            >
              {preparing ? "Preparando o site…" : loading ? "Criando a conta…" : "Montar nosso site"}
            </button>
            <p className={hintText}>
              Ao criar a conta, vocês concordam com os{" "}
              <Link href="/termos" prefetch={false} className={textLink}>
                Termos de uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" prefetch={false} className={textLink}>
                Política de privacidade
              </Link>
              .
            </p>
          </div>
        </form>

        <ul className="grid content-start gap-4">
          {POINTS.map((item) => (
            <li key={item.text} className="flex items-start gap-3 text-[0.9375rem] leading-6 text-ink">
              <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-forest/8 text-forest">
                <Icon name={item.icon} size={16} />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
