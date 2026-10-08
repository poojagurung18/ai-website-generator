import { createContext, Dispatch, SetStateAction } from "react";

export type UserDetail = {
  id: number,
  name: string,
  email: string,
  credits: number | null
}

type UserDetailContextType = {
  userDetail: UserDetail | null,
  setUserDetail: Dispatch<SetStateAction<UserDetail | null>>
}

export const UserDetailContext = createContext<UserDetailContextType>({
  userDetail: null,
  setUserDetail: () => {},
})
