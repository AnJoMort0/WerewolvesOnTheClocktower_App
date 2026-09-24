import { Button } from "@/components/ui/button";

export function GMPlayerActionApprovalPanel({ title, description, acceptLabel, denyLabel, closeLabel, resolved, onAccept, onDeny, onClose }: {
  title: string;
  description: string;
  acceptLabel: string;
  denyLabel: string;
  closeLabel: string;
  resolved: boolean;
  onAccept: () => void;
  onDeny: () => void;
  onClose: () => void;
}) {
  return <aside
    data-testid="gm-player-action-approval"
    className="relative z-20 mx-auto mt-3 w-[min(92vw,24rem)] rounded-xl border border-destructive/50 bg-card/95 p-4 shadow-2xl backdrop-blur-sm lg:absolute lg:right-4 lg:top-4 lg:mt-0"
  >
    <h2 className="font-display text-xl text-destructive">{title}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    <div className="mt-4 flex justify-end gap-2">
      {resolved ? <Button type="button" variant="secondary" onClick={onClose} className="font-display">
        {closeLabel}
      </Button> : <>
        <Button type="button" variant="secondary" onClick={onDeny} className="font-display">
          {denyLabel}
        </Button>
        <Button type="button" variant="destructive" onClick={onAccept} className="font-display">
          {acceptLabel}
        </Button>
      </>}
    </div>
  </aside>;
}
