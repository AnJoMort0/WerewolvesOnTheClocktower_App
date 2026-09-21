import { Button } from "@/components/ui/button";
import { GameModal } from "./GameModal";
import { PhoneActionScreen } from "./PhoneActionScreen";
import { format, getTranslation, type Language } from "@/lib/i18n";
import { getHuntConsensus, getRoleActionPhoneConfig, isRoleActionPhoneMode, type PhoneCommand, type PhoneSession, type PhoneView } from "@/lib/phoneActions";
import { PHONE_MODE } from "@/lib/phoneActionModes";
import type { RoleId } from "@/lib/roles";

/** The GM uses the same targets and controls as the phone, with approval authority. */
export function GMPhoneActionModal({ session, view, language, onClose, onSend, onResolveHunt, onResolveColossus, onResolvePriest, onRoleClick }: {
  session: PhoneSession;
  view: PhoneView;
  language: Language;
  onClose: () => void;
  onSend: (type: PhoneCommand["type"], targetPlayerId?: string, targetPlayerIds?: string[]) => void;
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
  const roleAction = isRoleActionPhoneMode(session.mode);
  const roleActionConfig = isRoleActionPhoneMode(session.mode) ? getRoleActionPhoneConfig(session.mode) : null;
  const title = session.mode === PHONE_MODE.COLOSSUS_RETALIATION ? translation.roleLabels.v27
    : session.mode === PHONE_MODE.MONKEY_TAMER_REVEAL ? translation.roleLabels.v26
    : session.mode === PHONE_MODE.SPIDER_TAMER_WEB ? translation.roleLabels.v23
    : session.mode === PHONE_MODE.PRIEST_CONFESSION ? translation.roleLabels.v25
    : session.mode === PHONE_MODE.SLEEPWALKER_VISIT ? translation.roleLabels.v16
    : session.mode === PHONE_MODE.SOLDIER_ASSASSINATION ? text.soldier
    : roleActionConfig ? translation.roleLabels[roleActionConfig.roleId]
    : session.mode === PHONE_MODE.WEREWOLF_HUNT ? text.hunt
    : session.mode === PHONE_MODE.WEREWOLF_ALLIES ? text.allies
    : session.mode === PHONE_MODE.EVIL_WITCH_POISON ? text.poison : text.shaman;
  const showsSelection = session.mode === PHONE_MODE.PRIEST_CONFESSION || session.mode === PHONE_MODE.SPIDER_TAMER_WEB
    || session.mode === PHONE_MODE.SLEEPWALKER_VISIT || roleAction;
  const subtitle = proposal ? format(showsSelection ? text.selection
    : session.mode === PHONE_MODE.WEREWOLF_HUNT && !session.sourcePlayerId ? text.huntRequest : text.soloHuntRequest,
  { actor: name(session.sourcePlayerId), target: name(proposal) })
    : session.priestReveal ? format(text.selection, { actor: name(session.sourcePlayerId), target: name(session.priestReveal.targetPlayerId) })
    : session.mode === PHONE_MODE.WEREWOLF_HUNT ? text.huntVotes
    : session.mode === PHONE_MODE.COLOSSUS_RETALIATION ? text.colossusInstructions : undefined;
  const resolve = (accepted: boolean) => {
    if (!proposal) return;
    if (session.mode === PHONE_MODE.COLOSSUS_RETALIATION) onResolveColossus(session.id, proposal, accepted);
    else if (session.mode === PHONE_MODE.PRIEST_CONFESSION) onResolvePriest(session.id, proposal, accepted);
    else onResolveHunt(session.id, proposal, accepted);
  };
  const requiresApproval = session.mode === PHONE_MODE.WEREWOLF_HUNT || session.mode === PHONE_MODE.COLOSSUS_RETALIATION
    || session.mode === PHONE_MODE.PRIEST_CONFESSION;
  return <GameModal open onClose={onClose} title={title} subtitle={subtitle}
    closeLabel={text.close} dismissible={false} showCloseButton
    footer={proposal && requiresApproval && !session.completed && !session.approvalResult ? <div className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" onClick={() => resolve(false)}>{translation.ui.gmDenyAction}</Button>
      <Button variant="destructive" onClick={() => resolve(true)}>{translation.ui.gmAcceptAction}</Button>
    </div> : undefined}>
    <PhoneActionScreen key={session.id} session={view} playerId="gm" language={language}
      pending={false} connected gmControlled showHeader={false} showSelectionStatus={false} unframed onSend={onSend} onRoleClick={onRoleClick} />
    {session.mode === PHONE_MODE.WEREWOLF_HUNT && <ul className="mt-3 space-y-1 text-sm">
      {session.participantIds.map((id) => <li key={id} className="flex justify-between gap-4">
        <span>{name(id)}</span>
        <span className="text-muted-foreground">{session.votes[id] ? name(session.votes[id]) : "—"}</span>
      </li>)}
    </ul>}
  </GameModal>;
}
