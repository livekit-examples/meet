const KEY = 'previously-loaded-servers'

export const getPreviouslyLoadedServers = () => localStorage.getItem(KEY)?.split(',') || null

export const addServerToPreviouslyLoaded = (server: string) => {
  const previouslyLoadedServers = getPreviouslyLoadedServers() || []
  previouslyLoadedServers.push(server)
  localStorage.setItem(KEY, previouslyLoadedServers.join(','))
}
