export const locations = {
  root: (worldsContentServerUrl?: string) => '/' + (worldsContentServerUrl ? `?worlds-content-server-url=${worldsContentServerUrl}` : ''),
  signIn: (redirectTo?: string) => {
    return `/sign-in${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ''}`
  },
  meet: (server: string, token: string) => `/meet/${server}?token${token}`
}
