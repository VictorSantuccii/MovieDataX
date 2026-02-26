const API_BASE_URL = "https://api.themoviedb.org/3";

type FetchOptions = {
	params?: Record<string, string | number | boolean | undefined>;
	cacheSeconds?: number;
};

const buildQuery = (params: FetchOptions["params"] = {}) => {
	const query = new URLSearchParams();
	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined) {
			query.set(key, String(value));
		}
	});
	return query.toString();
};

const getAuthHeaders = () => {
	const token = process.env.TMDB_READ_ACCESS_TOKEN;
	if (!token) {
		throw new Error("Missing TMDB_READ_ACCESS_TOKEN in environment.");
	}
	return {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	};
};

const fetchTmdb = async <T>(path: string, options: FetchOptions = {}) => {
	const query = buildQuery(options.params);
	const url = query ? `${API_BASE_URL}${path}?${query}` : `${API_BASE_URL}${path}`;

	const response = await fetch(url, {
		headers: getAuthHeaders(),
		next: { revalidate: options.cacheSeconds ?? 3600 },
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`TMDB request failed (${response.status}): ${errorText}`);
	}

	return (await response.json()) as T;
};

export type TmdbMovie = {
	id: number;
	title: string;
	vote_average: number;
	release_date?: string;
	genre_ids?: number[];
	poster_path?: string;
	backdrop_path?: string;
};

export type TmdbListItem = {
	id: number;
	media_type?: "movie" | "tv";
	title?: string;
	name?: string;
	vote_average?: number;
	release_date?: string;
	first_air_date?: string;
	genre_ids?: number[];
	poster_path?: string;
	backdrop_path?: string;
};

export type TmdbListResponse = {
	page: number;
	results: TmdbListItem[];
	total_pages: number;
	total_results: number;
};

export type TmdbMultiResult = {
	id: number;
	media_type: "movie" | "tv" | "person";
	title?: string;
	name?: string;
	vote_average?: number;
	release_date?: string;
	first_air_date?: string;
};

export type TmdbMultiResponse = {
	page: number;
	results: TmdbMultiResult[];
	total_pages: number;
	total_results: number;
};

export type TmdbGenre = {
	id: number;
	name: string;
};

export type TmdbImage = {
	file_path: string;
	width: number;
	height: number;
};

export type TmdbVideo = {
	id: string;
	key: string;
	name: string;
	site: string;
	type: string;
};

export type TmdbReview = {
	id: string;
	author: string;
	content: string;
	created_at: string;
	url: string;
};

export type TmdbReviewsResponse = {
	page: number;
	results: TmdbReview[];
	total_pages: number;
	total_results: number;
};

export type TmdbDetails = {
	id: number;
	media_type: "movie" | "tv";
	title?: string;
	name?: string;
	overview?: string;
	poster_path?: string;
	backdrop_path?: string;
	vote_average?: number;
	vote_count?: number;
	release_date?: string;
	first_air_date?: string;
	runtime?: number;
	episode_run_time?: number[];
	genres?: TmdbGenre[];
	status?: string;
	budget?: number;
	revenue?: number;
	homepage?: string;
	tagline?: string;
	number_of_seasons?: number;
	number_of_episodes?: number;
	created_by?: Array<{
		id: number;
		name: string;
	}>;
	images?: {
		backdrops?: TmdbImage[];
		posters?: TmdbImage[];
	};
	videos?: {
		results?: TmdbVideo[];
	};
	credits?: TmdbCredits;
	reviews?: TmdbReviewsResponse;
};

export type TmdbTrendingResponse = {
	page: number;
	results: TmdbMovie[];
	total_pages: number;
	total_results: number;
};

export type TmdbCredits = {
	id: number;
	cast: Array<{
		id: number;
		name: string;
		character?: string;
		order?: number;
		profile_path?: string;
	}>;
	crew: Array<{
		id: number;
		name: string;
		job: string;
		department: string;
	}>;
};

export const getTrendingMovies = (language = "pt-BR") =>
	fetchTmdb<TmdbTrendingResponse>("/trending/movie/week", {
		params: { language },
		cacheSeconds: 1800,
	});

export const searchMovies = (query: string, language = "pt-BR") =>
	fetchTmdb<TmdbTrendingResponse>("/search/movie", {
		params: { query, language, include_adult: false },
		cacheSeconds: 300,
	});

export const getTrendingAll = (
	timeWindow: "day" | "week" = "week",
	language = "pt-BR"
) =>
	fetchTmdb<TmdbListResponse>(`/trending/all/${timeWindow}`, {
		params: { language },
		cacheSeconds: 900,
	});

export const getPopularMovies = (language = "pt-BR") =>
	fetchTmdb<TmdbListResponse>("/movie/popular", {
		params: { language },
		cacheSeconds: 1800,
	});

export const getTopRatedMovies = (language = "pt-BR") =>
	fetchTmdb<TmdbListResponse>("/movie/top_rated", {
		params: { language },
		cacheSeconds: 1800,
	});

export const getMovieCredits = (id: number, language = "pt-BR") =>
	fetchTmdb<TmdbCredits>(`/movie/${id}/credits`, {
		params: { language },
		cacheSeconds: 1800,
	});

export const searchMulti = (query: string, language = "pt-BR") =>
	fetchTmdb<TmdbMultiResponse>("/search/multi", {
		params: { query, language, include_adult: false },
		cacheSeconds: 300,
	});

export const getTitleDetails = (
	mediaType: "movie" | "tv",
	id: number,
	language = "pt-BR"
) =>
	fetchTmdb<TmdbDetails>(`/${mediaType}/${id}`, {
		params: {
			language,
			append_to_response: "images,videos,credits",
			include_image_language: `${language},en,null`,
		},
		cacheSeconds: 1800,
	});

export const getTitleReviews = (
	mediaType: "movie" | "tv",
	id: number,
	language = "pt-BR"
) =>
	fetchTmdb<TmdbReviewsResponse>(`/${mediaType}/${id}/reviews`, {
		params: { language },
		cacheSeconds: 1800,
	});
