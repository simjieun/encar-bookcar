// /books 세그먼트 전체(목록·상세·등록·수정)가 공유하는 로딩 화면.
// 화면마다 다른 스켈레톤을 두면 실제 UI와 어긋나므로, 진행 중임만 알리는 상단 로딩바 하나로 처리한다.
export default function BooksLoading() {
	return (
		<main className="route-loading">
			<div
				className="route-progress"
				role="status"
				aria-label="불러오는 중"
			/>
		</main>
	);
}
