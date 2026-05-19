import { describe, expect, it, vi } from 'vitest';

import { listSquareGridArtworkOptions } from './artwork';

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
});
