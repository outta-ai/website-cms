import { useCallback, useEffect, useState } from "react";

export function useDelayed(
	fn: () => void,
	delay: number,
	deps: unknown[] = [],
) {
	const [trigger, setTrigger] = useState(false);

	const callback = useCallback(fn, deps);

	useEffect(() => {
		if (!trigger) return;

		setTrigger(false);
		const timeout = setTimeout(callback, delay);
		return () => clearTimeout(timeout);
	}, [delay, callback, trigger]);

	return [() => setTrigger(true), () => setTrigger(false)];
}
