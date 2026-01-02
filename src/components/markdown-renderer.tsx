import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import mermaid from "mermaid"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "inherit",
})

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const renderDiagram = async () => {
      if (!ref.current) return

      try {
        const id = `mermaid-${Math.random().toString(36).substring(7)}`
        const { svg } = await mermaid.render(id, chart)
        setSvg(svg)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to render diagram")
      }
    }

    renderDiagram()
  }, [chart])

  if (error) {
    return (
      <div className="p-4 border border-destructive/50 rounded-md bg-destructive/10 text-destructive text-sm">
        <p className="font-medium">Diagram Error</p>
        <p className="text-xs mt-1 opacity-80">{error}</p>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="my-4 flex justify-center overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={cn("prose prose-sm dark:prose-invert max-w-none", className)}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          const language = match ? match[1] : ""
          const codeContent = String(children).replace(/\n$/, "")

          if (language === "mermaid") {
            return <MermaidDiagram chart={codeContent} />
          }

          const isInline = !className

          if (isInline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <div className="relative my-4">
              {language && (
                <div className="absolute top-0 right-0 px-2 py-1 text-xs text-muted-foreground bg-muted rounded-bl-md rounded-tr-md">
                  {language}
                </div>
              )}
              <pre className="p-4 rounded-md bg-muted overflow-x-auto">
                <code className="text-sm font-mono" {...props}>
                  {children}
                </code>
              </pre>
            </div>
          )
        },
        table({ children }) {
          return (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-muted">{children}</thead>
        },
        th({ children }) {
          return (
            <th className="border border-border px-4 py-2 text-left font-medium">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="border border-border px-4 py-2">{children}</td>
          )
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {children}
            </a>
          )
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-4 italic text-muted-foreground">
              {children}
            </blockquote>
          )
        },
        ul({ children }) {
          return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>
        },
        h1({ children }) {
          return <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
        },
        hr() {
          return <hr className="my-6 border-border" />
        },
        input({ checked, ...props }) {
          return (
            <input
              type="checkbox"
              checked={checked}
              disabled
              className="mr-2 accent-primary"
              {...props}
            />
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
