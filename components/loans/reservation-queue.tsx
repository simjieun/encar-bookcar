import type { LoanView } from '@/lib/types/loan';

const formatDate = new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' });

export function ReservationQueue({ queue }: { queue: LoanView[] }) {
	return (
		<ol className="reservation-queue">
			{queue.map((item) => (
				<li key={item.id}>
					<span>{item.queuePosition}</span>
					<strong>{item.borrowerName}</strong>
					<small>{formatDate.format(new Date(item.requestedAt))} 예약</small>
				</li>
			))}
		</ol>
	);
}
