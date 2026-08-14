import { create } from 'zustand'

const useUserStore = create((set) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoadingProfile: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),

  setProfile: (profile) =>
    set({
      profile,
    }),

  setLoadingProfile: (bool) =>
    set({
      isLoadingProfile: bool,
    }),

  logout: () => {
    localStorage.removeItem('oia_user_id')
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoadingProfile: false,
    })
  },
}))

export default useUserStore
