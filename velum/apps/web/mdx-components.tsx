import type { MDXComponents } from "mdx/types";
import { Callout, Steps, Step } from "@/components/docs";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mb-8 font-sentient text-4xl font-semibold tracking-tight">
        {children}
      </h1>
    ),
    h2: ({ children, id }) => (
      <h2
        id={id}
        className="mb-4 mt-12 scroll-mt-24 border-b border-border pb-2 font-sentient text-2xl font-semibold"
      >
        {children}
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3
        id={id}
        className="mb-3 mt-8 scroll-mt-24 font-mono text-lg font-medium"
      >
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-4 font-mono text-sm leading-relaxed text-foreground/80">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="mb-4 ml-6 list-disc space-y-2 font-mono text-sm text-foreground/80">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-4 ml-6 list-decimal space-y-2 font-mono text-sm text-foreground/80">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    code: ({ children }) => (
      <code className="rounded bg-border/30 px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="mb-4 overflow-x-auto rounded-lg border border-border bg-background p-4">
        {children}
      </pre>
    ),
    strong: ({ children }) => (
      <strong className="font-medium text-foreground">{children}</strong>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary underline underline-offset-4 hover:text-primary/80"
      >
        {children}
      </a>
    ),
    table: ({ children }) => (
      <div className="mb-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse font-mono text-sm">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-foreground/5">{children}</thead>
    ),
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => (
      <tr className="border-b border-border last:border-b-0">{children}</tr>
    ),
    th: ({ children }) => (
      <th className="px-4 py-3 text-left font-medium text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-foreground/80">
        {children}
      </td>
    ),
    Callout,
    Steps,
    Step,
  };
}
