import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { WantedForm } from '@/components/wanted/wanted-form';
import { getCurrentSession } from '@/lib/auth-session';

export const metadata: Metadata = {
	title: '책 찾기 | 엔카북카',
	description: '읽고 싶은 책을 올리고 가진 동료를 찾아보세요.',
};
export const dynamic = 'force-dynamic';

export default async function NewWantedPage() {
	const session = await getCurrentSession();
	if (!session) redirect('/login?returnTo=/wanted/new');

	return (
		<main className="book-form-page">
			<SiteHeader />
			<section className="book-form-hero compact">
				<Link
					className="form-back-link"
					href="/wanted"
				>
					<ChevronLeft size={16} /> 책 찾아요 목록으로
				</Link>
				<p>FIND A BOOK</p>
				<h1>읽고 싶은 책을 알려주세요</h1>
				<span>책을 가진 동료가 &ldquo;나 있어요&rdquo;로 답해줄 거예요.</span>
			</section>
			<WantedForm />
		</main>
	);
}
