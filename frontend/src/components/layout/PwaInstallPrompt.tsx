import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);

    setShareSupported(Boolean(navigator.share));

    if (window.navigator.standalone === false || window.navigator.standalone === undefined) {
      const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
      if (isIos && !isStandalone) {
        setShowIosPrompt(true);
      }
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as EventListener);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      console.log("PWA installation accepted");
    }
    setDeferredPrompt(null);
  };

  const openIosShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: document.title,
          url: window.location.href,
        });
        return;
      } catch (error) {
        console.warn("Share dialog not completed", error);
        alert("O compartilhamento foi cancelado ou não foi possível abrir. Use o botão de compartilhar do Safari e escolha 'Adicionar à Tela de Início'.");
        return;
      }
    }

    alert("Para instalar no iPhone, toque no botão de compartilhar do Safari e escolha 'Adicionar à Tela de Início'.");
  };

  const closePrompt = () => {
    setShowIosPrompt(false);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt && !showIosPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-2xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/95 sm:left-auto sm:right-6 sm:w-[380px]">
      {deferredPrompt ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Instalar Agenda</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Adicione o app à tela inicial para abrir como um aplicativo.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={install}>Instalar</Button>
            <Button variant="secondary" onClick={closePrompt}>
              Fechar
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Instalar Agenda no iPhone</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Abra o menu de compartilhamento e escolha "Adicionar à Tela de Início".</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={openIosShare}>Abrir compartilhamento</Button>
            <Button variant="secondary" onClick={closePrompt}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}
