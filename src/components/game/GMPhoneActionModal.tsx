import { Button } from "@/components/ui/button";
import { GameModal } from "./GameModal";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { format, getTranslation, type Language } from "@/lib/i18n";
import { getHuntConsensus, type PhoneCommand, type PhoneSession, type PhoneView } from "@/lib/phoneActions";
import type { RoleId } from "@/lib/roles";

/** The GM uses the same targets and controls as the phone, with approval authority. */
export function GMPhoneActionModal({ session, view, language, onClose, onSend, onResolveHunt, onResolveColossus, onResolvePriest, onRoleClick }: {
  session: PhoneSession;
  view: PhoneView;
  language: Language;
  onClose: () => void;
  onSend: (type: PhoneCommand["type"], targetPlayerId?: string) => void;
  onResolveHunt: (sessionId: string, targetPlayerId: string, accepted: boolean) => void;
  onResolveColossus: (sessionId: string, targetPlayerId: string, accepted: boolean) => void;
  onResolvePriest: (sessionId: string, targetPlayerId: string, accepted: boolean) => void;
  onRoleClick?: (roleId: RoleId) => void;
}) {
  const translation = getTranslation(language);
  const text = translation.ui.phoneActions;
  const consensus = getHuntConsensus(session);
  const proposal = session.pendingTargetPlayerId ?? consensus;
  const name = (id: string | null) => view.players.find((player) => player.id === id)?.name ?? translation.ui.unknown;
  const title = session.mode === "colossus" ? translation.roleLabels.v27
    : session.mode === "monkey" ? translation.roleLabels.v26
    : session.mode === "web" ? translation.roleLabels.v23
    : session.mode === "priest" ? translation.roleLabels.v25
    : session.mode === "sleepwalker" ? translation.roleLabels.v16 : text[session.mode];
  const showsSelection = session.mode === "priest" || session.mode === "web" || session.mode === "sleepwalker";
  const subtitle = proposal ? format(showsSelection ? text.selection
    : session.mode === "hunt" && !session.sourcePlayerId ? text.huntRequest : text.soloHuntRequest,
  { actor: name(session.sourcePlayerId), target: name(proposal) })
    : session.priestReveal ? format(text.selection, { actor: name(session.sourcePlayerId), target: name(session.priestReveal.targetPlayerId) })
    : session.mode === "hunt" ? text.huntVotes : session.mode === "colossus" ? text.colossusInstructions : undefined;
  const resolve = (accepted: boolean) => {
    if (!proposal) return;
    if (session.mode === "colossus") onResolveColossus(session.id, proposal, accepted);
    else if (session.mode === "priest") onResolvePriest(session.id, proposal, accepted);
    else onResolveHunt(session.id, proposal, accepted);
  };
  const requiresApproval = session.mode === "hunt" || session.mode === "colossus" || session.mode === "priest";
  return <GameModal open onClose={onClose} title={title} subtitle={subtitle}
    closeLabel={text.close} dismissible={false} showCloseButton
    footer={proposal && requiresApproval ? <div className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" onClick={() => resolve(false)}>{translation.ui.gmDenyAction}</Button>
      <Button variant="destructive" onClick={() => resolve(true)}>{translation.ui.gmAcceptAction}</Button>
    </div> : undefined}>
    <PhoneActionScreen key={session.id} session={view} playerId="gm" language={language}
      pending={false} connected gmControlled showHeader={false} showSelectionStatus={false} unframed onSend={onSend} onRoleClick={onRoleClick} />
    {session.mode === "hunt" && <ul className="mt-3 space-y-1 text-sm">
      {session.participantIds.map((id) => <li key={id} className="flex justify-between gap-4">
        <span>{name(id)}</span>
        <span className="text-muted-foreground">{session.votes[id] ? name(session.votes[id]) : "—"}</span>
      </li>)}
    </ul>}
  </GameModal>;
}
