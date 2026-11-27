/**
 * Returns a copy of the list with `item` placed before `beforeId`, or last when
 * it is null. Shared so the sidebar can show a move before main confirms it.
 */
export const moveBefore = <T extends { id: string }>(
  items: T[],
  item: T,
  beforeId: string | null,
): T[] => {
  if (beforeId === item.id)
    return items.map((current) => (current.id === item.id ? item : current));
  const next = items.filter((current) => current.id !== item.id);
  const index =
    beforeId === null
      ? next.length
      : next.findIndex((current) => current.id === beforeId);
  if (index < 0) throw new Error("The list changed. Try again.");
  next.splice(index, 0, item);
  return next;
};
