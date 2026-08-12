import Image from 'next/image';
import { BookOpen } from 'lucide-react';

// 카카오가 주는 thumbnail은 120×174라 확대하면 깨진다. URL의 fname에 원본(약 458×650)이 들어 있어 그걸 쓴다.
function originalCover(src: string) {
	// URL.parse는 Node 22.1+ 전용이라 Node 20에서 죽는다. canParse는 Node 18.17+에 있다.
	const fname = URL.canParse(src) ? new URL(src).searchParams.get('fname') : null;
	return fname?.startsWith('http') ? fname.replace(/^http:/, 'https:') : src;
}

export function BookCover({
	src,
	title,
	priority = false,
	sizes = '(max-width: 760px) 45vw, 240px',
}: {
	src: string | null;
	title: string;
	priority?: boolean;
	sizes?: string;
}) {
	return (
		<div className="real-book-cover">
			{src ? (
				<Image
					src={originalCover(src)}
					alt={`${title} 표지`}
					fill
					sizes={sizes}
					className="object-cover"
					priority={priority}
				/>
			) : (
				<div className="book-cover-fallback">
					<BookOpen
						size={30}
						aria-hidden="true"
					/>
					<strong>{title}</strong>
				</div>
			)}
		</div>
	);
}
