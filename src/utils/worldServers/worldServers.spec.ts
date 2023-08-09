import { PREVIOUSLY_LOADED_SERVERS_KEY, addServerToPreviouslyLoaded, getPreviouslyLoadedServers } from './worldServers'

describe('when getting the previously loaded servers from the local storage', () => {
  describe('and the key is not yet set', () => {
    beforeEach(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(null)
    })

    it('should return an empty array', () => {
      expect(getPreviouslyLoadedServers()).toStrictEqual([])
    })
  })

  describe('and the value is empty', () => {
    beforeEach(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce('')
    })

    it('should return an empty array', () => {
      expect(getPreviouslyLoadedServers()).toStrictEqual([])
    })
  })

  describe('and the value has one previously loaded server', () => {
    let previouslyLoadedServer: string

    beforeEach(() => {
      previouslyLoadedServer = 'previous-server.dcl.eth'
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(previouslyLoadedServer)
    })

    it('should return an array with the previously loaded server', () => {
      expect(getPreviouslyLoadedServers()).toStrictEqual([previouslyLoadedServer])
    })
  })

  describe('and the value has multiple previously loaded server', () => {
    let previouslyLoadedServers: string[]

    describe('and all the servers are different', () => {
      beforeEach(() => {
        previouslyLoadedServers = ['previous-server.dcl.eth', 'another-server.dcl.eth', 'and-another-server.dcl.eth']
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(previouslyLoadedServers.join(','))
      })

      it('should return an array with all those different servers', () => {
        expect(getPreviouslyLoadedServers()).toStrictEqual(previouslyLoadedServers)
      })
    })

    describe('and there are some duplicates in the local storage value', () => {
      beforeEach(() => {
        previouslyLoadedServers = [
          'previous-server.dcl.eth',
          'another-server.dcl.eth',
          'another-server.dcl.eth',
          'and-another-server.dcl.eth',
          'and-another-server.dcl.eth',
          'and-another-server.dcl.eth'
        ]
        jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(previouslyLoadedServers.join(','))
      })

      it('should return an array with only one occurrence of each server', () => {
        expect(getPreviouslyLoadedServers()).toStrictEqual([
          'previous-server.dcl.eth',
          'another-server.dcl.eth',
          'and-another-server.dcl.eth'
        ])
      })
    })
  })
})

describe('when adding a new server to the same key in the local storage', () => {
  let newServer: string

  beforeEach(() => {
    newServer = 'new-server.dcl.eth'
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(jest.fn())
  })

  describe('and the new server is already in the array of previously loaded servers', () => {
    beforeEach(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce([newServer].join(','))
      addServerToPreviouslyLoaded(newServer)
    })

    it('should not call the local storage set method to add the new server', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(localStorage.setItem).not.toBeCalled()
    })
  })

  describe('and there was not previous loaded servers in the local storage', () => {
    beforeEach(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(null)
      addServerToPreviouslyLoaded(newServer)
    })

    it('should set in the local storage only the new server', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(localStorage.setItem).toBeCalledWith(PREVIOUSLY_LOADED_SERVERS_KEY, newServer)
    })
  })

  describe('and there were some previous loaded servers in the local storage', () => {
    const previouslyLoadedServers = ['previous-server.dcl.eth', 'another-server.dcl.eth', 'and-another-server.dcl.eth']

    beforeEach(() => {
      jest.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(previouslyLoadedServers.join(','))
      addServerToPreviouslyLoaded(newServer)
    })

    it('should set in the local storage only the new server', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(localStorage.setItem).toBeCalledWith(PREVIOUSLY_LOADED_SERVERS_KEY, [...previouslyLoadedServers, newServer].join(','))
    })
  })
})
