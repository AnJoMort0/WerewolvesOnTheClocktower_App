import { useEffect, useMemo, useState } from "react";
import { Check, Dices, Route, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameModal, GamePanel } from "./GameModal";
import { getRoleLabel, getTranslation, type Language } from "@/lib/i18n";
import { PHONE_ACTION_PRESENTATION } from "@/lib/phoneActionPresentation";
import { PHONE_MODE } from "@/lib/phoneActionModes";
import type { PhoneView } from "@/lib/phoneActions";
import { ROLES, TRAVELLER_ROLES, type RoleId } from "@/lib/roles";
import { RULEBOOK_CHARACTER_ORDER } from "@/lib/rulebookContent";
import { resolveRoleImage } from "@/lib/skinPacks";
import { useSkinPack } from "@/lib/skinPackContext";
import { getGamblerPathPlayerIds } from "@/lib/gambler";

const MAP_RADIUS_PERCENT = 39;

const GUESSABLE_ROLES = RULEBOOK_CHARACTER_ORDER.filter((id): id is RoleId => (
  id in ROLES && !TRAVELLER_ROLES.includes(id as RoleId)
));

export function GamblerGuessModal({ session, language, pending = false, connected = true, embedded = false,
  onConfirmPlayers, onConfirmRole, onClose, onReopen }: {
  session: PhoneView;
  language: Language;
  pending?: boolean;
  connected?: boolean;
  embedded?: boolean;
  onConfirmPlayers: (playerIds: string[]) => void;
  onConfirmRole: (roleId: RoleId) => void;
  onClose?: () => void;
  onReopen?: () => void;
}) {
  const text = getTranslation(language).ui.phoneActions;
  const { skinPackId } = useSkinPack();
  const [endpoints, setEndpoints] = useState<string[]>([]);
  const [longerPath, setLongerPath] = useState(false);
  const [lastRemoved, setLastRemoved] = useState<{ id: string; anchor: string; previousPathKey: string } | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<RoleId | null>(null);
  useEffect(() => {
    setEndpoints([]);
    setLongerPath(false);
    setLastRemoved(null);
    setSelectedRoleId(null);
  }, [session.id]);

  const players = useMemo(() => [...session.players]
    .sort((left, right) => (left.seat_position ?? 999) - (right.seat_position ?? 999)), [session.players]);
  const selectableIds = players.filter((player) => player.selectable).map((player) => player.id);
  const localPlayerIds = endpoints.length === 0 ? []
    : getGamblerPathPlayerIds(selectableIds, endpoints[0], endpoints[1], longerPath);
  const selectedPlayerIds = session.gamblerReveal?.playerIds ?? session.pendingTargetPlayerIds ?? localPlayerIds;
  const selectedPlayerSet = new Set(selectedPlayerIds);
  const endpointSet = new Set(endpoints);
  const choosingRole = !!session.pendingTargetPlayerIds?.length && !session.gamblerReveal;
  const reveal = session.gamblerReveal;

  const toggleEndpoint = (playerId: string) => {
    if (!session.players.some((player) => player.id === playerId && player.selectable)) return;
    if (endpoints.includes(playerId)) {
      if (endpoints.length === 2) {
        const anchor = endpoints.find((id) => id !== playerId)!;
        setEndpoints([anchor]);
        setLastRemoved({ id: playerId, anchor, previousPathKey: [...localPlayerIds].sort().join(",") });
      } else {
        setEndpoints([]);
        setLastRemoved(null);
      }
      setLongerPath(false);
      return;
    }
    if (endpoints.length === 0) {
      setEndpoints([playerId]);
      setLastRemoved(null);
      setLongerPath(false);
      return;
    }
    if (endpoints.length === 1) {
      const shorterPathKey = getGamblerPathPlayerIds(selectableIds, endpoints[0], playerId).sort().join(",");
      const useLongerPath = lastRemoved?.id === playerId && lastRemoved.anchor === endpoints[0]
        && lastRemoved.previousPathKey === shorterPathKey;
      setEndpoints([endpoints[0], playerId]);
      setLongerPath(useLongerPath);
      setLastRemoved(null);
      return;
    }
    setEndpoints([endpoints[1], playerId]);
    setLastRemoved(null);
    setLongerPath(false);
  };

  if (session.visible === false) return onReopen ? (
    <Button variant="secondary" disabled={pending || !connected} onClick={onReopen}>
      <Dices className="mr-2 h-4 w-4" />{text.open}
    </Button>
  ) : null;

  const playerCircle = <div className="space-y-2">
    <div data-testid="gambler-player-circle" className="relative mx-auto aspect-square w-full max-w-[300px]">
      <Dices className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-violet-300/50" />
      {players.map((player, index) => {
        const angle = (2 * Math.PI * index) / Math.max(players.length, 1) - Math.PI / 2;
        const isSelected = selectedPlayerSet.has(player.id);
        const isEndpoint = endpointSet.has(player.id);
        return <button key={player.id} type="button" aria-label={player.name} aria-pressed={isSelected}
          disabled={choosingRole || !!reveal || pending || !connected || !player.selectable}
          onClick={() => toggleEndpoint(player.id)}
          className="absolute flex w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
          style={{ left: `${50 + MAP_RADIUS_PERCENT * Math.cos(angle)}%`, top: `${50 + MAP_RADIUS_PERCENT * Math.sin(angle)}%` }}>
          <span className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 font-bold transition-colors ${
            isEndpoint ? "border-violet-200 bg-violet-500/40 ring-2 ring-violet-300/40"
            : isSelected ? "border-violet-400 bg-violet-500/20"
            : player.selectable ? "border-border bg-background/70"
            : "border-border bg-background/50 grayscale opacity-30"
          }`}>
            {player.name.charAt(0).toUpperCase()}
            {player.dead && <X className="absolute h-9 w-9 text-muted-foreground" strokeWidth={3} />}
          </span>
          <span className="max-w-full truncate text-xs text-foreground">{player.name}</span>
        </button>;
      })}
    </div>
    {longerPath && endpoints.length === 2 && <p role="status" className="flex items-center justify-center gap-1 text-center text-xs text-violet-200">
      <Route className="h-3.5 w-3.5" />{text.gamblerLongPath}
    </p>}
  </div>;

  const roleGrid = <div data-testid="gambler-role-grid" className="grid grid-cols-3 gap-2 sm:grid-cols-4">
    {GUESSABLE_ROLES.map((roleId) => {
      const selected = selectedRoleId === roleId || reveal?.roleId === roleId;
      return <button key={roleId} type="button" disabled={!!reveal || pending || !connected}
        aria-label={getRoleLabel(roleId, language)} aria-pressed={selected}
        onClick={() => setSelectedRoleId(roleId)}
        className={`min-w-0 rounded-md border p-2 text-center transition-colors ${selected
          ? "border-violet-300 bg-violet-500/20 ring-1 ring-violet-300/40"
          : "border-border bg-card/60 hover:border-violet-400/60"}`}>
        <img src={resolveRoleImage(roleId, { skinPackId }).src} alt="" draggable={false}
          className="mx-auto aspect-square w-full max-w-20 rounded object-cover" />
        <span className="mt-1 block truncate text-[10px] text-muted-foreground">{roleId}</span>
        <strong className="block text-xs leading-tight text-foreground">{getRoleLabel(roleId, language)}</strong>
      </button>;
    })}
  </div>;

  const content = reveal ? <div className="space-y-4">
    <div role="status" className={`rounded-lg border p-6 text-center ${reveal.correct
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
      : "border-destructive/50 bg-destructive/10 text-red-200"}`}>
      {reveal.correct ? <ThumbsUp className="mx-auto mb-3 h-12 w-12" /> : <ThumbsDown className="mx-auto mb-3 h-12 w-12" />}
      <strong className="font-display text-2xl">{reveal.correct ? text.gamblerYes : text.gamblerNo}</strong>
      <p className="mt-2 text-sm">{reveal.correct ? text.gamblerCorrect : text.gamblerWrong}</p>
    </div>
    {roleGrid}
  </div> : choosingRole ? roleGrid : playerCircle;

  const footer = <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
    {!choosingRole && !reveal && <Button disabled={selectedPlayerIds.length === 0 || pending || !connected}
      onClick={() => onConfirmPlayers(selectedPlayerIds)}>
      <Check className="mr-2 h-4 w-4" />{text.gamblerConfirmPlayers}
    </Button>}
    {choosingRole && <Button disabled={!selectedRoleId || pending || !connected}
      onClick={() => selectedRoleId && onConfirmRole(selectedRoleId)}>
      <Dices className="mr-2 h-4 w-4" />{text.gamblerConfirmRole}
    </Button>}
    {onClose && <Button variant="secondary" onClick={onClose} disabled={pending || !connected}>
      <X className="mr-2 h-4 w-4" />{text.close}
    </Button>}
  </div>;
  const subtitle = reveal ? getRoleLabel(reveal.roleId, language)
    : choosingRole ? text.gamblerChooseRole : text.gamblerChoosePlayers;
  const title = getRoleLabel("t02", language);
  const panelClass = `border-violet-400/40 ring-violet-400/10 ${PHONE_ACTION_PRESENTATION[PHONE_MODE.GAMBLER_GUESS].iconClass}`;
  return embedded
    ? <GamePanel title={title} subtitle={subtitle} footer={footer} className={panelClass}>{content}</GamePanel>
    : <GameModal open onClose={onClose ?? (() => undefined)} title={title} subtitle={subtitle} closeLabel={text.close}
      showCloseButton={false} dismissible={!!onClose && !pending && connected} footer={footer} wide>{content}</GameModal>;
}
