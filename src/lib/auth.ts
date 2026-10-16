import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { logServerError } from "@/lib/funnel";
import { toBrazilE164 } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorna o usuário autenticado ou redireciona para /login.
 * Use no topo de Server Components protegidos.
 */
export async function requireUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Exige um usuário com papel admin. Redireciona a /login se não autenticado e
 * a /dashboard se autenticado mas sem permissão. Use em rotas do /admin.
 */
export async function requireAdmin(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

/**
 * Garante (idempotente) que o usuário logado tem uma linha em `profiles`.
 * O trigger em auth.users foi removido de propósito (migration 0002): o perfil
 * é criado pela aplicação quando já existe sessão (auth.uid() = id do usuário),
 * coberto pela policy profiles_insert_self.
 */
export async function ensureProfile(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      name: (user.user_metadata?.name as string | undefined) ?? null
    },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // WhatsApp pedido no cadastro: chega no user_metadata (signUp roda no navegador), vai para
  // a CONTA (profiles.whatsapp, 0012) sem sobrescrever um número já salvo no editor, e sai do
  // metadata para não ficar duplicado no Auth. Validado de novo aqui: o metadata vem do navegador.
  // Só limpa o metadata depois de gravar: se falhar, tenta de novo no próximo /onboarding.
  const whatsapp = toBrazilE164(String(user.user_metadata?.whatsapp ?? ""));
  if (user.user_metadata?.whatsapp !== undefined && user.user_metadata?.whatsapp !== null) {
    if (whatsapp) {
      const { error } = await supabase.from("profiles").update({ whatsapp }).eq("id", user.id).is("whatsapp", null);
      if (error) {
        await logServerError("profile.whatsappFromSignup", error, { userId: user.id, path: "/onboarding" });
        return;
      }
    }
    await supabase.auth.updateUser({ data: { whatsapp: null } });
  }
}
