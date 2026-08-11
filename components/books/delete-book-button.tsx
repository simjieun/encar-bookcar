"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteBookButton({ bookId }: { bookId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("책을 삭제하지 못했어요.");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["books"] });
      router.replace("/books"); router.refresh();
    },
  });

  return <button className="book-delete-button" type="button" disabled={mutation.isPending} onClick={() => { if (window.confirm("이 책을 정말 삭제할까요?")) mutation.mutate(); }}><Trash2 size={17} />{mutation.isPending ? "삭제 중" : "삭제"}</button>;
}
