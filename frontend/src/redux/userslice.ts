import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CurrentUser {
  userId?: string;
  _id?: string;
  firebaseuid?: string;
  name: string;
  email: string;
  profilePicture?: string | null;
  role: string;
  partnerProfile?: {
    slug?: string | null;
    bio?: string;
    website?: string;
    socialLink?: {
      youtube?: string;
      instagram?: string;
      linkedin?: string;
      github?: string;
    };
  };
  paymentDetails?: {
    method?: "upi" | "bank";
    upiId?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
  };
  totalSales?: number;
  totalRevenue?: number;
  paidOutRevenue?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CurrentUserResponse {
  success: boolean;
  user: CurrentUser;
  message?: string;
}

interface UserState {
  currentUser: CurrentUser | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: UserState = {
  currentUser: null,
  status: "idle",
  error: null,
};

export const fetchCurrentUser = createAsyncThunk<
  CurrentUser,
  void,
  { rejectValue: string }
>("user/fetchCurrentUser", async (_, { rejectWithValue }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    return rejectWithValue("VITE_BACKEND_URL is not configured.");
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/api/me`, {
      credentials: "include",
    });
  } catch {
    return rejectWithValue("Could not reach the backend. Check that the server is running.");
  }

  let result: CurrentUserResponse | { success?: false; message?: string };
  try {
    result = await response.json();
  } catch {
    return rejectWithValue("The backend returned an unreadable response.");
  }

  if (!response.ok || !result.success || !("user" in result)) {
    return rejectWithValue(
      "message" in result && result.message
        ? result.message
        : "Could not load the current user.",
    );
  }

  return result.user;
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCurrentUser(state, action: PayloadAction<CurrentUser>) {
      state.currentUser = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearCurrentUser(state) {
      state.currentUser = null;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentUser = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? action.error.message ?? "Could not load the current user.";
      });
  },
});

export const { clearCurrentUser, setCurrentUser } = userSlice.actions;
export default userSlice.reducer;
