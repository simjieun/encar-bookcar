'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Search, UserRound } from 'lucide-react';

type Member = { id: string; name: string; email: string };

export function MemberPicker({
	name,
	memberId,
	onChange,
	label = '현재 대여자',
}: {
	name: string;
	memberId: string;
	onChange: (name: string, memberId: string) => void;
	label?: string;
}) {
	const query = useQuery({
		queryKey: ['members', name],
		queryFn: async () => {
			const response = await fetch(`/api/members?query=${encodeURIComponent(name)}`);
			if (!response.ok) throw new Error('동료를 찾지 못했어요.');
			return (await response.json()) as { members: Member[] };
		},
		enabled: name.trim().length >= 1 && !memberId,
		staleTime: 30_000,
	});

	return (
		<div className="member-picker">
			<label>
				<span>{label}</span>
				<div className="member-picker-input">
					<Search size={17} />
					<input
						value={name}
						onChange={(event) => onChange(event.target.value, '')}
						onKeyDown={(event) => {
							// ponytail: 폼 안에서 쓰일 때 Enter가 상위 폼을 제출하는 것만 막는다
							if (event.key === 'Enter') event.preventDefault();
						}}
						placeholder="이름 또는 이메일로 찾아보세요"
						autoComplete="off"
					/>
					{memberId && <Check size={17} />}
				</div>
			</label>
			{memberId ? (
				<button
					type="button"
					className="member-picker-selected"
					onClick={() => onChange(name, '')}
				>
					<UserRound size={17} />
					회원 선택됨 · 직접 입력으로 바꾸기
				</button>
			) : name.trim() && query.data?.members.length ? (
				<div className="member-picker-results">
					{query.data.members.map((member) => (
						<button
							type="button"
							key={member.id}
							onClick={() => onChange(member.name, member.id)}
						>
							<UserRound size={17} />
							<span>
								<strong>{member.name}</strong>
								<small>{member.email}</small>
							</span>
						</button>
					))}
				</div>
			) : null}
			<p>목록에 없다면 이름을 그대로 입력해도 돼요.</p>
		</div>
	);
}
