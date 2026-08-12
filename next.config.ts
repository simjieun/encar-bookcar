import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	// ensureDatabase()가 런타임에 drizzle/*.sql을 읽으므로 서버 번들에 포함시킨다.
	outputFileTracingIncludes: { '/**': ['./drizzle/**'] },
	images: {
		remotePatterns: [
			{ protocol: 'https', hostname: '**.kakaocdn.net' },
			{ protocol: 'https', hostname: '**.daumcdn.net' },
		],
	},
};

export default nextConfig;
