export type Game = {
	id: string;
	title: string;
	cover?: string;
	hero?: string;
	launchable?: boolean;
	installState?: 'installed' | 'missing';
	lastPlayed?: string;
};
