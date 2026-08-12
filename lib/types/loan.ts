import type { LoanStatus } from '@/lib/schemas/loan';

export type LoanView = {
	id: string;
	bookId: string;
	bookTitle: string;
	bookAuthor: string;
	coverImageUrl: string | null;
	location: string | null;
	borrowerId: string;
	borrowerName: string;
	ownerId: string;
	ownerName: string;
	status: LoanStatus;
	queuePosition: number | null;
	requestedAt: string | Date;
	updatedAt: string | Date;
};
