"use client";

import { useIntersectionObserver } from "@uidotdev/usehooks";
import { type ReactNode, useRef } from "react";

interface HeadingProps {
	id?: string;
	level: 1 | 2 | 3;
	title: string;
	children: ReactNode;
	className: string;
}

export function HeadingWithRef({
	id,
	level,
	title,
	children,
	className,
}: HeadingProps) {
	const ref = useRef<HTMLHeadingElement>(null);
	const headingId = id;

	const Component = `h${level}` as const;

	return (
		<Component ref={ref} id={headingId} className={className}>
			{children}
		</Component>
	);
}
