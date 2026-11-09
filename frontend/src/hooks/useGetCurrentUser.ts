import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/redux/store";
import { fetchCurrentUser } from "@/redux/userslice";

const useAppDispatch = useDispatch.withTypes<AppDispatch>();
const useAppSelector = useSelector.withTypes<RootState>();

export function useGetCurrentUser() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const status = useAppSelector((state) => state.user.status);
  const error = useAppSelector((state) => state.user.error);

  useEffect(() => {
    if (status === "idle") {
      void dispatch(fetchCurrentUser());
    }
  }, [dispatch, status]);

  const refetch = useCallback(
    () => dispatch(fetchCurrentUser()),
    [dispatch],
  );

  return {
    currentUser,
    isLoading: status === "loading",
    error,
    refetch,
  };
}

export { useAppDispatch, useAppSelector };
