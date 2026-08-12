import Link from 'next/link';
import { BookOpen, CheckCircle2 } from 'lucide-react';

type AuthShellProps = {
	eyebrow: string;
	title: string;
	description: string;
	children: React.ReactNode;
};

const benefits = ['동료가 추천한 책을 한눈에 발견해요', '내 책을 등록하고 가볍게 나눠요', '읽고 싶은 책과 사람을 연결해요'];

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
	return (
		<main className="auth-page">
			<div
				className="auth-glow auth-glow-one"
				aria-hidden="true"
			/>
			<div
				className="auth-glow auth-glow-two"
				aria-hidden="true"
			/>

			<div className="auth-layout">
				<section
					className="auth-intro"
					aria-label="엔카북카 소개"
				>
					<Link
						className="auth-brand"
						href="/"
						aria-label="엔카북카 홈"
					>
						<span
							className="brand-mark"
							aria-hidden="true"
						>
							<BookOpen
								size={21}
								strokeWidth={2.6}
							/>
						</span>
						<span>엔카북카</span>
					</Link>

					<div>
						<p className="auth-intro-label">엔카인의 가장 가까운 서재</p>
						<h2>
							좋은 책을 발견하는 일,
							<br /> 이제 동료와 함께해요
						</h2>
						<ul>
							{benefits.map((benefit) => (
								<li key={benefit}>
									<CheckCircle2
										size={20}
										aria-hidden="true"
									/>
									{benefit}
								</li>
							))}
						</ul>
					</div>

					<p className="auth-intro-caption">좋은 책과 좋은 동료가 만나는 곳</p>
				</section>

				<section
					className="auth-card"
					aria-labelledby="auth-title"
				>
					<div className="auth-mobile-brand">
						<Link
							href="/"
							aria-label="엔카북카 홈"
						>
							<BookOpen
								size={20}
								strokeWidth={2.6}
							/>
						</Link>
					</div>
					<p className="auth-eyebrow">{eyebrow}</p>
					<h1 id="auth-title">{title}</h1>
					<p className="auth-description">{description}</p>
					{children}
				</section>
			</div>
		</main>
	);
}
