import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookDiscovery } from '@/components/book-discovery';

const sampleBook = {
	id: 'deb8fe43-bb4c-4f9d-85f2-d926fab4a557',
	title: '소년이 온다',
	author: '한강',
	description: null,
	coverImageUrl: null,
	publisher: '창비',
	isbn: '9788936434120',
	publishedAt: '20140519',
	sourceLink: null,
	location: '판교 오피스',
	status: 'AVAILABLE',
	ownership: 'CLUB',
	recommendation: null,
	currentBorrowerId: null,
	currentBorrowerName: null,
	ownerId: 'user-1',
	ownerName: '김독서',
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

function renderDiscovery() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<BookDiscovery />
		</QueryClientProvider>,
	);
}

beforeEach(() => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: string | URL | Request) => {
			const ownership = new URL(String(input), 'http://localhost').searchParams.get('ownership');
			const personalBook = { ...sampleBook, id: 'personal-1', title: '아몬드', ownership: 'PERSONAL', ownerName: '이소장' };
			return {
				ok: true,
				json: async () => ({
					books: ownership === 'PERSONAL' ? [personalBook] : [sampleBook],
					hasMore: false,
					page: 1,
				}),
			} as Response;
		}),
	);
});

describe('BookDiscovery', () => {
	it('북클럽 책장과 동료의 서재를 섹션으로 나눠 보여준다', async () => {
		renderDiscovery();
		await screen.findByRole('heading', { name: '아몬드' });

		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('ownership=CLUB'));
		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('ownership=PERSONAL'));
		expect(screen.getByRole('link', { name: '북클럽 책장 전체 보기' })).toHaveAttribute('href', '/books?ownership=CLUB');
		expect(screen.getByRole('link', { name: '동료의 서재 전체 보기' })).toHaveAttribute('href', '/books?ownership=PERSONAL');
		expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
	});

	it('개인 소장 책은 띠지와 소장자 문구로 북클럽 책과 구분한다', async () => {
		renderDiscovery();
		const personal = (await screen.findByRole('heading', { name: '아몬드' })).closest('a')!;
		expect(personal).toHaveTextContent('개인 소장');
		expect(personal).toHaveTextContent('이소장 님이 빌려줘요');

		const club = screen.getByRole('heading', { name: '소년이 온다' }).closest('a')!;
		expect(club).toHaveTextContent('북클럽 책 · 김독서 님 등록');
		expect(club).not.toHaveTextContent('개인 소장');
	});
});
