import { cn } from "@/lib/utils";
import { RecentPost } from "./components/post";

export default async function Home() {
	return (
		<main className="relative isolate flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
			<div className="-z-10 absolute inset-0 bg-[url('/noise.svg')] opacity-50 mix-blend-soft-light [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
			<div className="container flex flex-col items-center justify-center gap-6 px-4 py-16">
				<h1
					className={cn(
						"inline-flex flex-col gap-1 text-center tracking-tight transition",
						"font-display font-semibold text-4xl leading-none sm:text-5xl md:text-6xl lg:text-[4rem]",
						"bg-gradient-to-r from-20% bg-clip-text text-transparent",
						"from-white to-gray-50",
					)}
				>
					<span>JStack</span>
				</h1>

				<p className="mb-8 text-pretty text-center text-[#ececf399] text-lg/7 sm:text-wrap sm:text-center md:text-xl/8">
					The stack for building seriously fast, lightweight and{" "}
					<span className="inline sm:block">
						end-to-end typesafe Next.js apps.
					</span>
				</p>

				<RecentPost />
			</div>
		</main>
	);
}
