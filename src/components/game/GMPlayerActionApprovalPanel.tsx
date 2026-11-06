import { Button } from "@/components/ui/button";
import { ActionSelectionPrompt } from "./ActionSelectionPrompt";

export function GMPlayerActionApprovalPanel({ title, description, targetName, selectionLabel, acceptLabel, denyLabel, closeLabel, resolved, onAccept, onDeny, onClose }: {
  title: string;
  description: string;
  targetName: string;
  selectionLabel: string;
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
    className="fixed inset-x-3 top-3 z-[70] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-xl border border-destructive/50 bg-card p-4 shadow-2xl sm:left-auto sm:right-4 sm:top-4 sm:w-96"
  >
    <h2 className="mb-3 font-display text-xl text-foreground">{title}</h2>
    <ActionSelectionPrompt instruction={description} selection={targetName} selectionLabel={selectionLabel} emptyLabel={targetName} />
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
