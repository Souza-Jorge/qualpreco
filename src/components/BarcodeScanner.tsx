import { useCallback, useEffect, useRef, useState } from "react";
// `@zxing/library` é CommonJS: named exports não resolvem no SSR do Vite.
// `@zxing/browser` reexporta BarcodeFormat com segurança.
import {
  BrowserMultiFormatReader,
  BrowserCodeReader,
  BarcodeFormat,
} from "@zxing/browser";
import { Loader2, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

// DecodeHintType.POSSIBLE_FORMATS = 2, TRY_HARDER = 3
const HINTS = new Map<number, unknown>([
  [
    2,
    [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
    ],
  ],
  [3, true],
]);

function suportaCamera(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

function mensagemDeErro(e: unknown): string {
  const name = (e as { name?: string } | null)?.name ?? "";
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "A câmera só funciona em conexões seguras (HTTPS). Abra o app pelo endereço https.";
  }
  if (!suportaCamera()) {
    return "Este navegador não suporta leitura pela câmera. Digite o código na busca.";
  }
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Permissão de câmera negada. Libere o acesso à câmera nas configurações do navegador e tente de novo.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "Nenhuma câmera encontrada neste dispositivo. Se estiver no computador, use o leitor de código de barras ou digite o código.";
    case "NotReadableError":
    case "TrackStartError":
      return "A câmera está sendo usada por outro aplicativo. Feche-o e tente novamente.";
    default:
      return "Não foi possível iniciar a câmera. Tente novamente.";
  }
}

type Status = "starting" | "running" | "error";

const RE_TRASEIRA = /(back|rear|traseir|environment|world)/i;
const RE_FRONTAL = /(front|frontal|user|face)/i;

function acharTraseira(list: MediaDeviceInfo[]): MediaDeviceInfo | null {
  const back = list.find((d) => RE_TRASEIRA.test(d.label));
  if (back) return back;
  // Sem labels úteis: em celulares a última costuma ser a traseira
  const naoFrontais = list.filter((d) => !RE_FRONTAL.test(d.label));
  if (list.length > 1 && naoFrontais.length) {
    return naoFrontais[naoFrontais.length - 1] ?? null;
  }
  return null;
}

export function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const autoSelecionadaRef = useRef(false);
  const [status, setStatus] = useState<Status>("starting");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    const video = videoRef.current;
    const doStream = video?.srcObject as MediaStream | null;
    doStream?.getTracks().forEach((t) => t.stop());
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (video) video.srcObject = null;
    startingRef.current = false;
  }, []);

  // Ao fechar, zera a seleção manual para reabrir sempre na traseira
  useEffect(() => {
    if (!open) {
      setDeviceId(null);
      setDevices([]);
      autoSelecionadaRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus("starting");
    setErrorMsg("");

    if (!suportaCamera()) {
      setErrorMsg(mensagemDeErro(null));
      setStatus("error");
      return;
    }

    // Garante que nenhum stream anterior siga ativo (open alternando rápido)
    stopCamera();
    startingRef.current = true;

    const reader = new BrowserMultiFormatReader(HINTS as never);

    // Preferência: câmera escolhida > traseira exata > traseira ideal > qualquer uma
    const tentativas: MediaTrackConstraints[] = deviceId
      ? [{ deviceId: { exact: deviceId } }, { facingMode: { ideal: "environment" } }, {}]
      : [
          { facingMode: { exact: "environment" } },
          { facingMode: { ideal: "environment" } },
          {},
        ];

    const aoDetectar = (text: string) => {
      if (cancelled) return;
      cancelled = true;
      stopCamera();
      onDetected(text);
      onClose();
    };

    const esperarVideoPronto = async () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.readyState < 2) {
        await new Promise<void>((resolve) => {
          const done = () => {
            video.removeEventListener("loadeddata", done);
            resolve();
          };
          video.addEventListener("loadeddata", done);
          setTimeout(done, 4000);
        });
      }
      try {
        await video.play();
      } catch {
        /* alguns navegadores já iniciam sozinhos */
      }
    };

    const start = async () => {
      let ultimoErro: unknown = null;

      for (const video of tentativas) {
        try {
          const controls = await reader.decodeFromConstraints(
            { video },
            videoRef.current!,
            (result) => {
              if (!result) return;
              aoDetectar(result.getText());
            }
          );
          if (cancelled) {
            controls.stop();
            return;
          }
          controlsRef.current = controls;
          const stream =
            (videoRef.current?.srcObject as MediaStream | null) ?? null;
          streamRef.current = stream;

          await esperarVideoPronto();
          if (!cancelled) setStatus("running");

          try {
            const list = await BrowserCodeReader.listVideoInputDevices();
            if (cancelled) return;
            setDevices(list);

            // Se caímos numa câmera frontal, troca automaticamente pela traseira
            if (!deviceId && !autoSelecionadaRef.current && list.length > 1) {
              const track = stream?.getVideoTracks()[0];
              const settings = track?.getSettings?.() ?? {};
              const jaTraseira =
                settings.facingMode === "environment" ||
                RE_TRASEIRA.test(track?.label ?? "");
              if (!jaTraseira) {
                const traseira = acharTraseira(list);
                if (traseira && traseira.deviceId !== settings.deviceId) {
                  autoSelecionadaRef.current = true;
                  setDeviceId(traseira.deviceId);
                }
              }
            }
          } catch {
            /* lista de câmeras é opcional */
          }
          return;
        } catch (e) {
          ultimoErro = e;
        }
      }

      throw ultimoErro;
    };

    start()
      .catch((e) => {
        if (cancelled) return;
        console.error("Erro ao iniciar câmera:", e);
        setErrorMsg(mensagemDeErro(e));
        setStatus("error");
      })
      .finally(() => {
        startingRef.current = false;
      });

    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, deviceId, attempt]);


  const trocarCamera = () => {
    if (devices.length < 2) return;
    const current = devices.findIndex((d) => d.deviceId === deviceId);
    const next = devices[(current + 1) % devices.length];
    setDeviceId(next?.deviceId ?? null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          stopCamera();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escanear código de barras</DialogTitle>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {status !== "error" && (
            <div className="pointer-events-none absolute inset-0">
              {/* Máscara escura em volta da área de leitura */}
              <div className="absolute inset-0 bg-black/50 [clip-path:polygon(0_0,100%_0,100%_100%,0_100%,0_28%,8%_28%,8%_72%,92%_72%,92%_28%,0_28%)]" />
              {/* Cantos da moldura */}
              <div className="absolute inset-x-[8%] top-[28%] h-[44%]">
                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-md border-l-4 border-t-4 border-primary-foreground" />
                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-md border-r-4 border-t-4 border-primary-foreground" />
                <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-md border-b-4 border-l-4 border-primary-foreground" />
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-md border-b-4 border-r-4 border-primary-foreground" />
                {status === "running" && (
                  <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 bg-destructive shadow-[0_0_8px_var(--destructive)]" />
                )}
              </div>
            </div>
          )}

          {status === "starting" && (
            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 text-primary-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Iniciando câmera...</span>
            </div>
          )}

          {status === "running" && devices.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={trocarCamera}
              aria-label="Trocar câmera"
              className="absolute right-2 top-2 h-8 gap-1 bg-black/40 px-2 text-primary-foreground hover:bg-black/60 hover:text-primary-foreground"
            >
              <SwitchCamera className="h-4 w-4" />
              <span className="text-xs">Trocar</span>
            </Button>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center text-primary-foreground">
              <CameraOff className="h-8 w-8" />
              <p className="text-sm">{errorMsg}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAttempt((a) => a + 1)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {status === "running"
            ? "Aponte a câmera para o código de barras"
            : "Você também pode digitar o código na busca"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
