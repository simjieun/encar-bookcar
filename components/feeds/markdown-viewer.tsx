'use client';

import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import { useEffect, useRef } from 'react';

// 마크다운은 뷰어가 sanitize해서 렌더링한다 (직접 HTML을 주입하지 않는다).
export function MarkdownViewer({ content }: { content: string }) {
	const holder = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let disposed = false;
		let viewer: { destroy: () => void } | null = null;

		void (async () => {
			const { default: Viewer } = await import('@toast-ui/editor/dist/toastui-editor-viewer');
			if (disposed || !holder.current) return;
			viewer = new Viewer({ el: holder.current, initialValue: content });
		})();

		return () => {
			disposed = true;
			viewer?.destroy();
		};
	}, [content]);

	return (
		<div className="feed-content">
			<div ref={holder} />
			{/* 스크립트가 꺼져 있거나 뷰어 로딩 전에도 본문을 읽을 수 있게 원문을 함께 둔다. */}
			<noscript>
				<pre>{content}</pre>
			</noscript>
		</div>
	);
}
