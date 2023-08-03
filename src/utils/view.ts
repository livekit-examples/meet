export enum View {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OWN = 'own',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OTHER = 'other'
  // eslint-disable-next-line @typescript-eslint/naming-convention
}

export const getView = (loggedInAddress?: string, currentAccountAddress?: string): View => {
  return currentAccountAddress === loggedInAddress || (currentAccountAddress === undefined && loggedInAddress !== undefined)
    ? View.OWN
    : View.OTHER
}
