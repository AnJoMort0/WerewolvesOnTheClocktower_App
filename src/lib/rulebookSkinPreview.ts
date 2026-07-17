import type { RulebookSkinPreviewValue } from "@/lib/skinPacks";
import { RULEBOOK_CHARACTERS, type RulebookCharacterId } from "@/lib/rulebookContent";

type SkinPreviewOverrides = Partial<Record<RulebookCharacterId, RulebookSkinPreviewValue>>;

export function handleRulebookSkinPreviewChange(
  event: Event,
  container: ParentNode,
  setSkinPreviewOverrides: (updater: (current: SkinPreviewOverrides) => SkinPreviewOverrides) => void,
): void {
  if (!(event.target instanceof Element)) return;
  const select = event.target.closest<HTMLSelectElement>("select[data-rulebook-skin-select]");
  if (!(select instanceof HTMLSelectElement)) return;

  const characterId = select.dataset.rulebookSkinSelect as RulebookCharacterId | undefined;
  if (!characterId || !(characterId in RULEBOOK_CHARACTERS)) return;

  const value = select.value as RulebookSkinPreviewValue;
  const previewImage = select.selectedOptions[0]?.dataset.previewImage;
  if (previewImage) {
    const image = Array.from(container.querySelectorAll<HTMLImageElement>("img[data-rulebook-role-image]"))
      .find((candidate) => candidate.dataset.rulebookRoleImage === characterId);
    if (image) image.src = previewImage;
  }

  setSkinPreviewOverrides((current) => {
    const next = { ...current };
    if (value === "device") delete next[characterId];
    else next[characterId] = value;
    return next;
  });
}
