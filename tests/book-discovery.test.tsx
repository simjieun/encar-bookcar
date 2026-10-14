import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
			const url = String(input);
			const empty = url.includes('query=%EC%97%86%EB%8A%94+%EC%B1%85');
			const personalBook = { ...sampleBook, id: 'personal-1', title: '아몬드', ownership: 'PERSONAL', ownerName: '이소장' };
			return {
				ok: true,
				json: async () => ({
					books: empty ? [] : [sampleBook, personalBook],
					hasMore: false,
					page: 1,
				}),
			} as Response;
		}),
	);
});

describe('BookDiscovery', () => {
	it('실제 도서 API에서 책을 표시하고 검색한다', async () => {
		const user = userEvent.setup();
		renderDiscovery();
		expect((await screen.findAllByText('소년이 온다')).length).toBeGreaterThan(0);

		const search = screen.getByRole('searchbox', {
			name: '책 제목 또는 저자 검색',
		});
		await user.type(search, '한강{enter}');

		expect(fetch).toHaveBeenCalledWith(expect.stringContaining('query=%ED%95%9C%EA%B0%95'));
	});

	it('검색 결과가 없으면 책 등록을 안내한다', async () => {
		const user = userEvent.setup();
		renderDiscovery();
		const search = screen.getByRole('searchbox', {
			name: '책 제목 또는 저자 검색',
		});
		await user.type(search, '없는 책{enter}');

		expect(await screen.findByText('찾는 책이 아직 없어요')).toBeVisible();
		expect(screen.getByRole('link', { name: '책 등록하기' })).toHaveAttribute('href', '/books/new');
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
