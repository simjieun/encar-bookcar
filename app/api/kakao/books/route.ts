import { NextResponse } from 'next/server';
import { kakaoBookQuerySchema, kakaoBookResponseSchema } from '@/lib/schemas/book';
import { getRequestSession } from '@/lib/request-session';

export const dynamic = 'force-dynamic';

function stripMarkup(value: string) {
	return value
		.replace(/<[^>]*>/g, '')
		.replaceAll('&amp;', '&')
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&#39;', "'")
		.trim();
}

function secureUrl(value: string) {
	return value.startsWith('http://') ? `https://${value.slice(7)}` : value;
}

function toPublishedAt(datetime: string) {
	const date = datetime.slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.replaceAll('-', '') : '';
}

export async function GET(request: Request) {
	const session = await getRequestSession(request);
	if (!session) {
		return NextResponse.json({ message: '책을 검색하려면 먼저 로그인해 주세요.' }, { status: 401 });
	}

	const queryResult = kakaoBookQuerySchema.safeParse({
		query: new URL(request.url).searchParams.get('query') ?? '',
	});
	if (!queryResult.success) {
		return NextResponse.json({ message: queryResult.error.issues.at(0)?.message }, { status: 400 });
	}

	const restApiKey = process.env.KAKAO_REST_API_KEY;
	if (!restApiKey) {
		return NextResponse.json(
			{
				code: 'KAKAO_API_NOT_CONFIGURED',
				message: '카카오 책 검색 API 키가 아직 설정되지 않았어요.',
			},
			{ status: 503 },
		);
	}

	const endpoint = new URL('https://dapi.kakao.com/v3/search/book');
	endpoint.searchParams.set('query', queryResult.data.query);
	endpoint.searchParams.set('size', '10');
	endpoint.searchParams.set('page', '1');
	endpoint.searchParams.set('sort', 'accuracy');

	try {
		const response = await fetch(endpoint, {
			headers: { Authorization: `KakaoAK ${restApiKey}` },
			cache: 'no-store',
			signal: AbortSignal.timeout(7_000),
		});

		if (!response.ok) {
			return NextResponse.json(
				{
					message: '카카오에서 책을 검색하지 못했어요. 잠시 후 다시 시도해 주세요.',
				},
				{ status: response.status === 429 ? 429 : 502 },
			);
		}

		const parsed = kakaoBookResponseSchema.safeParse(await response.json());
		if (!parsed.success) {
			return NextResponse.json({ message: '책 검색 결과를 읽지 못했어요.' }, { status: 502 });
		}

		return NextResponse.json({
			total: parsed.data.meta.total_count,
			items: parsed.data.documents.map((book) => ({
				title: stripMarkup(book.title),
				author: book.authors.map(stripMarkup).join(', '),
				publisher: stripMarkup(book.publisher),
				description: stripMarkup(book.contents),
				coverImageUrl: secureUrl(book.thumbnail),
				isbn: book.isbn,
				publishedAt: toPublishedAt(book.datetime),
				sourceLink: secureUrl(book.url),
			})),
		});
	} catch {
		return NextResponse.json(
			{
				message: '책 검색 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.',
			},
			{ status: 504 },
		);
	}
}
