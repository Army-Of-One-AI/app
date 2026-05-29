import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const exmapleSlice = createSlice({
  name: "example",
  initialState: {
    name: "example",
  },
  reducers: {
    setName: (state, action: PayloadAction<{ name: string }>) => {
      state.name = action.payload.name;
    },
  },
});

export const { setName } = exmapleSlice.actions;
export default exmapleSlice.reducer;
