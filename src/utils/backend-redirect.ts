export const backendRedirect = (route: string) => ({
  redirect: {
    destination: `/${route}`,
    permanent: false
  }
})

