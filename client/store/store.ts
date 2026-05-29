import { configureStore } from "@reduxjs/toolkit";
import exampleReducer from "@/features/example-feature/slice";

export const store = configureStore({
  reducer: {
    example: exampleReducer,
  },
  devTools: process.env.NODE_ENV === "development",
});

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
