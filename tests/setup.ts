import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
	// DB 테스트는 node 환경에서 돌아서 document가 없다.
	if (typeof document !== 'undefined') {
		cleanup();
	}
});
