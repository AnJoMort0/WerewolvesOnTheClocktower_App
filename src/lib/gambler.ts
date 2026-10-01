/** Returns one inclusive path between two seats in circular order. */
export function getGamblerPathPlayerIds(
  orderedPlayerIds: readonly string[],
  firstPlayerId: string,
  secondPlayerId?: string,
  longerPath = false,
): string[] {
  const firstIndex = orderedPlayerIds.indexOf(firstPlayerId);
  if (firstIndex < 0) return [];
  if (!secondPlayerId || secondPlayerId === firstPlayerId) return [firstPlayerId];
  const secondIndex = orderedPlayerIds.indexOf(secondPlayerId);
  if (secondIndex < 0) return [];
  const walk = (step: 1 | -1) => {
    const result = [firstPlayerId];
    for (let index = firstIndex; result.length <= orderedPlayerIds.length; ) {
      index = (index + step + orderedPlayerIds.length) % orderedPlayerIds.length;
      result.push(orderedPlayerIds[index]);
      if (index === secondIndex) return result;
    }
    return [];
  };
  const clockwise = walk(1);
  const counterClockwise = walk(-1);
  const shorter = clockwise.length <= counterClockwise.length ? clockwise : counterClockwise;
  const longer = shorter === clockwise ? counterClockwise : clockwise;
  return longerPath ? longer : shorter;
}
