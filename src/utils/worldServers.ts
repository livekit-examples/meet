const KEY = 'previously-loaded-servers'

export const getPreviouslyLoadedServers = () => Array.from(new Set(localStorage.getItem(KEY)?.split(','))) || null

export const addServerToPreviouslyLoaded = (server: string) => {
  const previouslyLoadedServers = getPreviouslyLoadedServers() || []
  previouslyLoadedServers.push(server)
  localStorage.setItem(KEY, previouslyLoadedServers.join(','))
}
