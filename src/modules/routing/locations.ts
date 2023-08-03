export const locations = {
  root: () => '/',
  account: (address: string) => `/accounts/${address}`,
  signIn: (redirectTo?: string) => {
    return `/sign-in${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`
  }
}
