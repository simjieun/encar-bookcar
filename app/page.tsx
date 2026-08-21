import { ArrowRight, BookOpen, ChevronRight, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { BookDiscovery } from '@/components/book-discovery';
import { SiteHeader } from '@/components/site-header';
import { getBookStats } from '@/lib/book-data';

export const dynamic = 'force-dynamic';

export default async function Home() {
	const stats = await getBookStats();
	const bookStats = [
		{ value: `${stats.total}권`, label: '함께 읽는 책' },
		{ value: `${stats.owners}명`, label: '책을 나눈 동료' },
		{ value: `${stats.available}권`, label: '지금 읽을 수 있어요' },
	];
	return (
		<main className="min-h-screen overflow-hidden bg-white">
			<SiteHeader />

			<section
				id="top"
				className="hero-section"
			>
				<div
					className="hero-glow hero-glow-left"
					aria-hidden="true"
				/>
				<div
					className="hero-glow hero-glow-right"
					aria-hidden="true"
				/>
				<div className="site-container relative z-10 grid items-center gap-14 py-20 md:min-h-[690px] md:grid-cols-[1.08fr_0.92fr] md:py-24">
					<div className="max-w-[720px]">
						<div className="eyebrow">
							<Sparkles
								size={16}
								fill="currentColor"
								aria-hidden="true"
							/>
							엔카인의 가장 가까운 서재
						</div>
						<h1 className="mt-7 text-[42px] leading-[1.18] font-extrabold tracking-[-0.055em] text-strong sm:text-[54px] lg:text-[64px]">
							좋은 책은 함께 읽을 때
							<br className="hidden sm:block" /> 더 즐거우니까
						</h1>
						<p className="mt-7 max-w-[560px] text-[18px] leading-[1.75] font-medium tracking-[-0.025em] text-body sm:text-[20px]">
							동료가 추천하는 책을 발견하고,
							<br className="sm:hidden" /> 나누고 싶은 책을 등록해 보세요.
						</p>
						<div className="mt-10 flex flex-col gap-3 sm:flex-row">
							<a
								className="primary-button"
								href="#books"
							>
								책 둘러보기
								<ArrowRight
									size={19}
									aria-hidden="true"
								/>
							</a>
							<Link
								className="secondary-button"
								href="/books/new"
							>
								<Plus
									size={19}
									aria-hidden="true"
								/>
								책 등록하기
							</Link>
						</div>
					</div>

					<div
						className="hero-library"
						aria-label="책으로 채워진 엔카북카 서재 일러스트"
					>
						<div className="hero-library-badge">
							<span className="hero-library-badge-icon">
								<BookOpen size={19} />
							</span>
							<span>
								<strong>새로운 책 6권</strong>
								<small>이번 주에 도착했어요</small>
							</span>
						</div>
						<div
							className="floating-sparkle sparkle-one"
							aria-hidden="true"
						>
							✦
						</div>
						<div
							className="floating-sparkle sparkle-two"
							aria-hidden="true"
						>
							✦
						</div>
						<div
							className="book-stack"
							aria-hidden="true"
						>
							<div className="book book-blue">
								<span>
									생각의
									<br />
									지도
								</span>
								<i />
							</div>
							<div className="book book-coral">
								<span>
									작은
									<br />
									발견
								</span>
								<i />
							</div>
							<div className="book book-navy">
								<span>
									함께
									<br />
									읽는 밤
								</span>
								<i />
							</div>
							<div className="book book-mint">
								<span>
									일의
									<br />
									감각
								</span>
								<i />
							</div>
						</div>
						<div
							className="library-shelf"
							aria-hidden="true"
						/>
					</div>
				</div>
			</section>

			<section className="site-container -mt-1 pb-24 md:pb-32">
				<div className="stats-panel">
					{bookStats.map((stat) => (
						<div
							className="stat-item"
							key={stat.label}
						>
							<strong>{stat.value}</strong>
							<span>{stat.label}</span>
						</div>
					))}
				</div>
			</section>

			<BookDiscovery />

			<section
				id="share"
				className="site-container py-24 md:py-32"
			>
				<div className="share-card">
					<div className="relative z-10 max-w-[560px]">
						<span className="share-label">내 책장 속 좋은 책 한 권</span>
						<h2>동료에게 건네는 가장 쉬운 추천</h2>
						<p>책 제목과 저자만 입력하면 등록할 수 있어요. 표지와 상세 정보는 엔카북카가 채워드릴게요.</p>
						<Link href="/books/new">
							첫 책 등록하기
							<ChevronRight
								size={18}
								aria-hidden="true"
							/>
						</Link>
					</div>
					<div
						className="share-books"
						aria-hidden="true"
					>
						<span className="share-book share-book-one" />
						<span className="share-book share-book-two" />
						<span className="share-book share-book-three" />
					</div>
				</div>
			</section>

			<footer className="border-t border-[#f0f2f4] bg-[#f9fafb]">
				<div className="site-container flex flex-col gap-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-2 font-bold text-body">
						<BookOpen
							size={17}
							aria-hidden="true"
						/>{' '}
						엔카북카
					</div>
					<p>좋은 책과 좋은 동료가 만나는 곳</p>
				</div>
			</footer>
		</main>
	);
}
