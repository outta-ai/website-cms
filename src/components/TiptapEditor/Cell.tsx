type Props = {
	cellData: string | null;
};

export function Cell({ cellData }: Props) {
	if (!cellData) return null;

	return <div />;
}
