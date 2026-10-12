export type FeedView = {
	id: string;
	bookId: string;
	bookTitle: string;
	bookAuthor: string;
	coverImageUrl: string | null;
	authorId: string;
	authorName: string;
	title: string;
	content: string;
	commentCount: number;
	createdAt: string | Date;
	updatedAt: string | Date;
};

export type FeedCommentView = {
	id: string;
	feedId: string;
	parentId: string | null;
	authorId: string;
	authorName: string;
	content: string;
	createdAt: string | Date;
	reactions: FeedReactionSummary[];
};

/** 댓글 하나에 달린 이모지 하나의 집계 */
export type FeedReactionSummary = { emoji: string; count: number; reacted: boolean };

/** 최상위 댓글 하나와 그 대댓글들. 중첩은 1단계까지만이다. */
export type FeedCommentThread = FeedCommentView & { replies: FeedCommentView[] };

/** 피드를 쓸 수 있는 책 (내가 빌린 이력이 있는 책) */
export type FeedBookOption = {
	id: string;
	title: string;
	author: string;
	coverImageUrl: string | null;
};
