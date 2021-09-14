export const backendRedirect = (route: string, message: string) => {
  console.log(`Redirecting to '/${route}' (${message})`);
  return {
    redirect: {
      destination: `/${route}`,
      permanent: false,
    },
  };
};
