import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser";
// `@zxing/library` é CommonJS: named exports não resolvem no SSR do Vite.
import zxingLibrary from "@zxing/library";

import { Loader2, CameraOff, RefreshCw, SwitchCamera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

const { BarcodeFormat, DecodeHintType } = zxingLibrary;

const HINTS = new Map<number, unknown>([
  [
    DecodeHintType.POSSIBLE_FORMATS,
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
  [DecodeHintType.TRY_HARDER, true],
]);

function mensagemDeErro(e: unknown): string {
  const name = (e as { name?: string } | null)?.name ?? "";
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "A câmera só funciona em conexões seguras (HTTPS). Abra o app pelo endereço https.";
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

export function BarcodeScanner({ open, onClose, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (video) video.srcObject = null;
  }, []);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus("starting");
    setErrorMsg("");

    const reader = new BrowserMultiFormatReader(HINTS as never);

    const start = async () => {
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: "environment" } },
      };

      const controls = await reader.decodeFromConstraints(
        constraints,
        videoRef.current!,
        (result) => {
          if (cancelled || !result) return;
          cancelled = true;
          const text = result.getText();
          stopCamera();
          onDetected(text);
          onClose();
        }
      );
      controlsRef.current = controls;
      if (!cancelled) setStatus("running");

      try {
        const list = await BrowserCodeReader.listVideoInputDevices();
        if (!cancelled) setDevices(list);
      } catch {
        /* lista de câmeras é opcional */
      }
    };

    start().catch(async (e) => {
      if (cancelled) return;
      // Fallback: qualquer câmera disponível
      try {
        const controls = await reader.decodeFromConstraints(
          { video: true },
          videoRef.current!,
          (result) => {
            if (cancelled || !result) return;
            cancelled = true;
            stopCamera();
            onDetected(result.getText());
            onClose();
          }
        );
        controlsRef.current = controls;
        if (!cancelled) setStatus("running");
      } catch (e2) {
        if (cancelled) return;
        console.error("Erro ao iniciar câmera:", e2 ?? e);
        setErrorMsg(mensagemDeErro(e2 ?? e));
        setStatus("error");
      }
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

          {status === "running" && (
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-destructive shadow-[0_0_8px_var(--destructive)]" />
          )}

          {status === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-primary-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm">Iniciando câmera...</span>
            </div>
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

        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {status === "running"
              ? "Aponte a câmera para o código de barras"
              : "Você também pode digitar o código na busca"}
          </p>
          {devices.length > 1 && status === "running" && (
            <Button variant="outline" size="sm" onClick={trocarCamera}>
              <SwitchCamera className="mr-2 h-4 w-4" />
              Trocar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
