import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

/** Encerra a sessão (login). O app continua aberto. */
export async function sairDaConta() {
  await supabase.auth.signOut();
}

/**
 * Fecha o aplicativo. No Android (Capacitor) fecha de verdade;
 * no navegador o fechamento normalmente é bloqueado, então avisamos.
 */
export async function fecharAplicativo() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { App } = await import("@capacitor/app");
      await App.exitApp();
      return;
    }
  } catch {
    // segue para a tentativa no navegador
  }

  window.close();
  // Se o navegador bloquear, a página continua aberta.
  setTimeout(() => {
    if (!window.closed) {
      toast("Fechar só funciona no aplicativo instalado", {
        description: "No navegador, feche a aba manualmente.",
      });
    }
  }, 300);
}
