"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  listAllSubscriptionRequestsForAdmin,
  listMySubscriptionRequests,
  reviewSubscriptionRequest,
  submitSubscriptionRequest,
} from "@/lib/subscription/service";
import type {
  SubscriptionPaymentStatus,
  SubscriptionRequester,
  SubscriptionRequest,
  SubscriptionRequestInput,
} from "@/features/subscription/types";

type SubscriptionState = {
  requests: SubscriptionRequest[];
  isLoading: boolean;
  errorMessage: string | null;
  submitRequest: (input: SubscriptionRequestInput, requester: SubscriptionRequester) => Promise<void>;
  reviewRequest: (
    id: string,
    status: Exclude<SubscriptionPaymentStatus, "pending">,
    adminNote: string,
    reviewer: string
  ) => Promise<void>;
  loadMyRequests: () => Promise<void>;
  loadAdminRequests: () => Promise<void>;
  clearSubscriptionError: () => void;
};

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      requests: [],
      isLoading: false,
      errorMessage: null,
      submitRequest: async (input, requester) => {
        set({ isLoading: true, errorMessage: null });

        try {
          const created = await submitSubscriptionRequest(input);
          set((state) => ({
            requests: [created, ...state.requests.filter((request) => request.id !== created.id)],
            isLoading: false,
            errorMessage: null,
          }));
        } catch (error) {
          const fallback: SubscriptionRequest = {
            id: crypto.randomUUID(),
            userId: requester.userId,
            userName: requester.userName,
            userEmail: requester.userEmail,
            tier: "pro",
            amount: input.amount,
            months: input.months,
            method: "bkash",
            senderNumber: input.senderNumber,
            transactionId: input.transactionId.trim(),
            status: "pending",
            submittedAt: new Date().toISOString(),
          };

          set((state) => ({
            requests: [fallback, ...state.requests],
            isLoading: false,
            errorMessage:
              error instanceof Error
                ? `${error.message} Saved locally and will stay visible on this device.`
                : "Saved locally and will stay visible on this device.",
          }));
        }
      },
      reviewRequest: async (id, status, adminNote, reviewer) => {
        set({ isLoading: true, errorMessage: null });

        try {
          const updated = await reviewSubscriptionRequest(id, status, adminNote);
          set((state) => ({
            requests: state.requests.map((request) => (request.id === id ? updated : request)),
            isLoading: false,
            errorMessage: null,
          }));
          return;
        } catch (error) {
          set((state) => ({
            requests: state.requests.map((request) => {
              if (request.id !== id) {
                return request;
              }

              return {
                ...request,
                status,
                adminNote: adminNote.trim(),
                reviewedBy: reviewer,
                reviewedAt: new Date().toISOString(),
              };
            }),
            isLoading: false,
            errorMessage:
              error instanceof Error
                ? `${error.message} Updated locally only.`
                : "Unable to sync review with backend. Updated locally only.",
          }));
        }
      },
      loadMyRequests: async () => {
        set({ isLoading: true, errorMessage: null });

        try {
          const requests = await listMySubscriptionRequests();
          set({ requests, isLoading: false, errorMessage: null });
        } catch (error) {
          set({
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : "Could not load subscription requests.",
          });
        }
      },
      loadAdminRequests: async () => {
        set({ isLoading: true, errorMessage: null });

        try {
          const requests = await listAllSubscriptionRequestsForAdmin();
          set({ requests, isLoading: false, errorMessage: null });
        } catch (error) {
          set({
            isLoading: false,
            errorMessage: error instanceof Error ? error.message : "Could not load admin requests.",
          });
        }
      },
      clearSubscriptionError: () => {
        set({ errorMessage: null });
      },
    }),
    {
      name: STORAGE_KEYS.subscriptionRequests,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ requests: state.requests }),
    }
  )
);
