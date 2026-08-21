'use client';

import '@toast-ui/editor/dist/toastui-editor.css';
import { useEffect, useRef } from 'react';

// ponytail: @toast-ui/react-editor는 peer가 React 17이라 안 쓴다.
// vanilla 인스턴스를 useEffect에서 동적 import — 서버 번들에 브라우저 전용 코드가 섞이지 않는다.
export function MarkdownEditor({ initialValue, onChange }: { initialValue: string; onChange: (markdown: string) => void }) {
	const holder = useRef<HTMLDivElement>(null);
	const onChangeRef = useRef(onChange);
	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	useEffect(() => {
		let disposed = false;
		let editor: { destroy: () => void } | null = null;

		void (async () => {
			const [{ default: Editor }] = await Promise.all([import('@toast-ui/editor'), import('@toast-ui/editor/dist/i18n/ko-kr')]);
			if (disposed || !holder.current) return;
			const instance = new Editor({
				el: holder.current,
				height: '480px',
				initialEditType: 'markdown',
				previewStyle: 'vertical',
				language: 'ko-KR',
				usageStatistics: false,
				hideModeSwitch: false,
				initialValue,
			});
			instance.on('change', () => onChangeRef.current(instance.getMarkdown()));
			editor = instance;
		})();

		return () => {
			disposed = true;
			editor?.destroy();
		};
		// initialValue는 마운트 시 한 번만 반영한다 (에디터가 이후 상태를 소유).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div
			className="feed-editor"
			ref={holder}
		/>
	);
}
