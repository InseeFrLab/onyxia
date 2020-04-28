export interface Training {
	courseCode: string;
	name: string;
	abstract?: string;
	coursePrerequisites?: string;
	timeRequired?: string;
	author?: string;
	contributor?: string;
	copyrightHolder?: string;
	copyrightYear?: string;
	creativeWorkStatus?: string;
	inLanguage?: string;
	learningResourceType?: string;
	license?: string;
	version?: string;
	image?: string;
	deployment?: string;
	hasPart?: Training[];
}
