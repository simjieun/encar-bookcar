import type { BookStatus } from '@/lib/schemas/book';
import type { WantedStatus } from '@/lib/schemas/wanted';

export type WantedBookView = {
	id: string;
	requesterId: string;
	requesterName: string;
	title: string;
	author: string;
	publisher: string | null;
	isbn: string | null;
	coverImageUrl: string | null;
	publishedAt: string | null;
	sourceLink: string | null;
	message: string | null;
	status: WantedStatus;
	offerCount: number;
	createdAt: string | Date;
};

/** "나 있어요"를 누른 사람 */
export type WantedOfferView = { userId: string; userName: string; createdAt: string | Date };

/** 같은 ISBN으로 엔카북카 서가에 이미 있는 책 */
export type WantedLibraryMatch = { id: string; title: string; status: BookStatus };
