export function formatDisplayDate(date: string): string {
	const dateObj = new Date(date + 'T00:00:00');

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	const month = months[dateObj.getMonth()];
	const day = dateObj.getDate();
	const year = dateObj.getFullYear();

	return `${month} ${day}, ${year}`;
}

export function formatShortDate(date: string): string {
	const dateObj = new Date(date + 'T00:00:00');

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
	];

	const month = months[dateObj.getMonth()];
	const day = dateObj.getDate();

	return `${month} ${day}`;
}
