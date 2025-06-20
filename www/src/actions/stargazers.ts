"use server";

interface Stargazer {
	id: number;
	login: string;
	avatar_url: string;
}

type GithubResponse = {
	stargazers: Stargazer[];
	stargazerCount: number;
};

export const fetchStargazers = async ({
	GITHUB_TOKEN,
}: { GITHUB_TOKEN: string }): Promise<GithubResponse> => {
	if (!GITHUB_TOKEN) {
		throw new Error(
			"GitHub token is required but was not provided. Set the GITHUB_TOKEN environment variable.",
		);
	}

	const makeRequest = async (url: string, useToken = true) => {
		const headers: Record<string, string> = {
			Accept: "application/vnd.github+json",
			"X-GitHub-Api-Version": "2022-11-28",
			"User-Agent": "Cloudflare Workers",
		};

		if (useToken) {
			headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
		}

		const res = await fetch(url, { headers });

		if (res.status === 403) {
			// rate limit reached, retry without token
			if (useToken) {
				return makeRequest(url, false);
			}

			throw new Error(
				"Rate limit reached for both authenticated and unauthenticated requests",
			);
		}

		if (!res.ok) {
			const errorText = await res.text();
			throw new Error(
				`GitHub API failed: ${res.status} ${res.statusText} - ${errorText}`,
			);
		}

		return res;
	};

	try {
		const repoRes = await makeRequest(
			"https://api.github.com/repos/upstash/jstack",
		);
		const { stargazers_count } = (await repoRes.json()) as {
			stargazers_count: number;
		};

		const lastPage = Math.ceil(stargazers_count / 20);
		const remainingItems = stargazers_count % 20;
		const needExtraItems = remainingItems > 0 && remainingItems < 20;

		let stargazers: Stargazer[] = [];

		if (needExtraItems) {
			try {
				const previousPageRes = await makeRequest(
					`https://api.github.com/repos/upstash/jstack/stargazers?per_page=20&page=${lastPage - 1}`,
				);

				const previousPageStargazers =
					(await previousPageRes.json()) as Stargazer[];
				stargazers = previousPageStargazers.slice(-(20 - remainingItems));
			} catch (error) {
				console.error("[GitHub API Error] Failed to fetch previous page:", {
					page: lastPage - 1,
					error: error instanceof Error ? error.message : "Unknown error",
					timestamp: new Date().toISOString(),
				});
			}
		}

		try {
			const lastPageRes = await makeRequest(
				`https://api.github.com/repos/upstash/jstack/stargazers?per_page=20&page=${lastPage}`,
			);

			const lastPageStargazers = (await lastPageRes.json()) as Stargazer[];
			stargazers = [...stargazers, ...lastPageStargazers].reverse();

			return { stargazers, stargazerCount: stargazers_count };
		} catch (error) {
			console.error("[GitHub API Error] Failed to fetch last page:", {
				page: lastPage,
				error: error instanceof Error ? error.message : "Unknown error",
				timestamp: new Date().toISOString(),
			});
			throw error;
		}
	} catch (error) {
		console.error("[GitHub API Error] Unhandled error:", {
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		});

		return { stargazers: [], stargazerCount: 0 };
	}
};
