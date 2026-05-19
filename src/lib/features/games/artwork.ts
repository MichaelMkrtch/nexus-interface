export type SteamGridDbArtworkOption = {
	id: number;
	url: string;
	thumbnailUrl?: string;
	width: 1024;
	height: 1024;
	style: string[];
	score: number;
	nsfw: boolean;
	humor: boolean;
};

export type SteamGridDbArtworkErrorReason =
	| 'missing-api-key'
	| 'invalid-game-id'
	| 'network-error'
	| 'bad-response';

export type ListSquareGridOptionsResult =
	| { ok: true; options: SteamGridDbArtworkOption[] }
	| { ok: false; reason: SteamGridDbArtworkErrorReason; error: string };

export async function listSquareGridArtworkOptions(
	gameId: string
): Promise<ListSquareGridOptionsResult> {
	const artworkApi = getArtworkApi();
	if (!artworkApi) {
		return {
			ok: false,
			reason: 'missing-api-key',
			error: 'SteamGridDB artwork lookup is only available inside the Electron shell.'
		};
	}

	return artworkApi.listSquareGridOptions(gameId);
}

function getArtworkApi() {
	if (typeof window === 'undefined') return undefined;

	return window.api?.artwork;
}
