export const hasProfileSection = (
  defaultValues: Record<string, unknown>,
  section: string
): boolean => {
  if (
    typeof defaultValues.profile !== 'object' ||
    defaultValues.profile === null
  ) {
    return false;
  }
  const profile = defaultValues.profile as Record<string, unknown>;
  const sectionValue = profile[section];
  return (
    typeof sectionValue === 'object' &&
    sectionValue !== null &&
    Object.keys(sectionValue as object).length > 0
  );
};
