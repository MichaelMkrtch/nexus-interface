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

export type ArtworkOverrideKind = 'cover' | 'background';

export type ArtworkOverride = {
	gameId: string;
	kind: ArtworkOverrideKind;
	imageUrl: string;
	storagePath: string;
	source: 'local-file' | 'steamgriddb';
	sourceUrl?: string;
	sourceId?: string;
	originalFileName?: string;
	contentHash: string;
	updatedAt: string;
};

export type SetArtworkOverrideResult =
	| { ok: true; override: ArtworkOverride }
	| {
			ok: false;
			reason: 'cancelled' | 'invalid-input' | 'file-error' | 'network-error';
			error: string;
	  };

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

export async function pickLocalImageArtworkOverride(
	gameId: string,
	kind: ArtworkOverrideKind
): Promise<SetArtworkOverrideResult> {
	const artworkApi = getArtworkApi();
	if (!artworkApi?.pickLocalImageOverride) {
		return {
			ok: false,
			reason: 'file-error',
			error: 'Local artwork uploads are only available inside the Electron shell.'
		};
	}

	return artworkApi.pickLocalImageOverride(gameId, kind);
}

export async function setSteamGridDbArtworkOverride(options: {
	gameId: string;
	kind: ArtworkOverrideKind;
	imageUrl: string;
	imageId?: number | string;
	originalFileName?: string;
}): Promise<SetArtworkOverrideResult> {
	const artworkApi = getArtworkApi();
	if (!artworkApi?.setSteamGridDbImageOverride) {
		return {
			ok: false,
			reason: 'network-error',
			error: 'SteamGridDB artwork overrides are only available inside the Electron shell.'
		};
	}

	return artworkApi.setSteamGridDbImageOverride(options);
}

function getArtworkApi() {
	if (typeof window === 'undefined') return undefined;

	return window.api?.artwork;
}
