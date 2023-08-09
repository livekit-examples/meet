export const PREVIOUSLY_LOADED_SERVERS_KEY = 'previously-loaded-servers'

export const getPreviouslyLoadedServers = () =>
  Array.from(new Set(localStorage.getItem(PREVIOUSLY_LOADED_SERVERS_KEY)?.split(',').filter(Boolean)))

export const addServerToPreviouslyLoaded = (server: string) => {
  const previouslyLoadedServers = getPreviouslyLoadedServers() || []

  if (previouslyLoadedServers.includes(server)) return

  previouslyLoadedServers.push(server)
  localStorage.setItem(PREVIOUSLY_LOADED_SERVERS_KEY, previouslyLoadedServers.join(','))
}
