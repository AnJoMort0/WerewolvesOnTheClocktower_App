import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { ImagePlus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal } from "@/components/game/GameModal";
import { t, type Language } from "@/lib/i18n";
import { parseRoomQrDestination, type RoomQrDestination } from "@/lib/roomQr";

export function RoomQrScannerModal({ open, language, onClose, onScanned }: {
  open: boolean;
  language: Language;
  onClose: () => void;
  onScanned: (destination: RoomQrDestination) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const completedRef = useRef(false);
  const [cameraError, setCameraError] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const handleResult = (data: string) => {
    if (completedRef.current) return;
    const destination = parseRoomQrDestination(data, window.location.origin);
    if (!destination) {
      setInvalid(true);
      return;
    }
    completedRef.current = true;
    scannerRef.current?.stop();
    onScanned(destination);
  };

  useEffect(() => {
    if (!open || !videoRef.current) return;
    completedRef.current = false;
    setCameraError(false);
    setInvalid(false);
    const scanner = new QrScanner(videoRef.current, (result) => handleResult(result.data), {
      preferredCamera: "environment",
      highlightScanRegion: true,
      highlightCodeOutline: true,
      returnDetailedScanResult: true,
    });
    scannerRef.current = scanner;
    void scanner.start().catch(() => setCameraError(true));
    return () => {
      scanner.destroy();
      if (scannerRef.current === scanner) scannerRef.current = null;
    };
  // onScanned is intentionally read when the scanner opens.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const scanImage = async (file?: File) => {
    if (!file) return;
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      handleResult(result.data);
    } catch {
      setInvalid(true);
    }
  };

  return <GameModal open={open} onClose={onClose} title={t("qrScannerTitle", language)}
    subtitle={t("qrScannerInstructions", language)} closeLabel={t("close", language)}>
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-primary/40 bg-black">
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
        <QrCode className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-white/25" />
      </div>
      {cameraError && <p role="status" className="text-sm text-amber-300">{t("qrScannerCameraError", language)}</p>}
      {invalid && <p role="alert" className="text-sm text-destructive">{t("qrScannerInvalid", language)}</p>}
      <Button asChild variant="secondary" className="w-full">
        <label className="cursor-pointer">
          <ImagePlus className="mr-2 h-4 w-4" />
          {t("qrScannerUpload", language)}
          <input type="file" accept="image/*" capture="environment" className="sr-only"
            onChange={(event) => { void scanImage(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
      </Button>
    </div>
  </GameModal>;
}
