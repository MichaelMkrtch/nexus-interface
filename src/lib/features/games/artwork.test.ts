import { describe, expect, it, vi } from 'vitest';

import {
	listSquareGridArtworkOptions,
	pickLocalImageArtworkOverride,
	setSteamGridDbArtworkOverride
} from './artwork';

describe('game artwork client', () => {
	it('returns a clear error when artwork lookup is requested outside the electron shell', async () => {
		const originalApi = window.api;
		window.api = undefined;

		try {
			await expect(listSquareGridArtworkOptions('steam:1091500')).resolves.toEqual({
				ok: false,
				reason: 'missing-api-key',
				error: 'SteamGridDB artwork lookup is only available inside the Electron shell.'
			});
		} finally {
			window.api = originalApi;
		}
	});

	it('passes square grid lookups through to the preload api when it is available', async () => {
		const originalApi = window.api;
		const listSquareGridOptions = vi.fn().mockResolvedValue({
			ok: true,
			options: [
				{
					id: 1,
					url: 'https://images.example.test/square.png',
					thumbnailUrl: 'https://images.example.test/square-thumb.png',
					width: 1024,
					height: 1024,
					style: [],
					score: 0,
					nsfw: false,
					humor: false
				}
			]
		});
		window.api = {
			artwork: {
				listSquareGridOptions
			}
		};

		try {
			await expect(listSquareGridArtworkOptions('steam:1091500')).resolves.toEqual({
				ok: true,
				options: [
					{
						id: 1,
						url: 'https://images.example.test/square.png',
						thumbnailUrl: 'https://images.example.test/square-thumb.png',
						width: 1024,
						height: 1024,
						style: [],
						score: 0,
						nsfw: false,
						humor: false
					}
				]
			});
			expect(listSquareGridOptions).toHaveBeenCalledWith('steam:1091500');
		} finally {
			window.api = originalApi;
		}
	});

	it('passes artwork override writes through to the preload api', async () => {
		const originalApi = window.api;
		const pickLocalImageOverride = vi.fn().mockResolvedValue({
			ok: false,
			reason: 'cancelled',
			error: 'No image was selected.'
		});
		const setSteamGridDbImageOverride = vi.fn().mockResolvedValue({
			ok: true,
			override: {
				gameId: 'steam:1091500',
				kind: 'cover',
				imageUrl: 'nexus-artwork://local/custom-cover',
				storagePath: 'artwork/overrides/steam_1091500/cover.png',
				source: 'steamgriddb',
				contentHash: 'hash',
				updatedAt: '2026-05-18T00:00:00.000Z'
			}
		});
		window.api = {
			artwork: {
				listSquareGridOptions: vi.fn(),
				pickLocalImageOverride,
				setSteamGridDbImageOverride
			}
		};

		try {
			await expect(pickLocalImageArtworkOverride('steam:1091500', 'cover')).resolves.toEqual({
				ok: false,
				reason: 'cancelled',
				error: 'No image was selected.'
			});
			await expect(
				setSteamGridDbArtworkOverride({
					gameId: 'steam:1091500',
					kind: 'cover',
					imageUrl: 'https://images.example.test/cover.png',
					imageId: 123
				})
			).resolves.toMatchObject({
				ok: true,
				override: {
					imageUrl: 'nexus-artwork://local/custom-cover'
				}
			});

			expect(pickLocalImageOverride).toHaveBeenCalledWith('steam:1091500', 'cover');
			expect(setSteamGridDbImageOverride).toHaveBeenCalledWith({
				gameId: 'steam:1091500',
				kind: 'cover',
				imageUrl: 'https://images.example.test/cover.png',
				imageId: 123
			});
		} finally {
			window.api = originalApi;
		}
	});
});
