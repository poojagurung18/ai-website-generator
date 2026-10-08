import { createContext, Dispatch, SetStateAction } from "react";

// Holds a timestamp; setting it signals the playground to save the current design
type OnSaveContextType = {
  onSaveData: number | null,
  setOnSaveData: Dispatch<SetStateAction<number | null>>
}

export const OnSaveContext = createContext<OnSaveContextType>({
  onSaveData: null,
  setOnSaveData: () => {},
});
