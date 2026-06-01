import useCurrentUserInfo from "./useCurrentUserInfo";

export default function useAuthentication() {
  const { data, isLoading, error } = useCurrentUserInfo();

  return {
    userInfo: data ?? null,
    isLoading,
    isAuthenticated: !!data,
    error,
  };
}
