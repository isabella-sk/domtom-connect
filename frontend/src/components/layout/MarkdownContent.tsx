import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { ReactNode } from "react";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

type NodeProps = { children?: ReactNode };
type AnchorProps = { href?: string; children?: ReactNode };

const components: Components = {
  h1: ({ children }: NodeProps) => (
    <h1
      style={{
        fontSize: 20,
        fontWeight: 800,
        color: "#0a1d52",
        margin: "20px 0 10px",
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: NodeProps) => (
    <h2
      style={{
        fontSize: 17,
        fontWeight: 700,
        color: "#0a1d52",
        margin: "18px 0 8px",
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: NodeProps) => (
    <h3
      style={{
        fontSize: 15,
        fontWeight: 600,
        color: "#0a1d52",
        margin: "14px 0 6px",
      }}
    >
      {children}
    </h3>
  ),
  p: ({ children }: NodeProps) => (
    <p style={{ margin: "0 0 12px", lineHeight: 1.75 }}>{children}</p>
  ),
  ul: ({ children }: NodeProps) => (
    <ul
      style={{
        paddingLeft: 22,
        margin: "0 0 12px",
        listStyleType: "disc", // ← puces rondes
      }}
    >
      {children}
    </ul>
  ),
  ol: ({ children }: NodeProps) => (
    <ol
      style={{
        paddingLeft: 22,
        margin: "0 0 12px",
        listStyleType: "decimal", // ← numéros
      }}
    >
      {children}
    </ol>
  ),
  li: ({ children }: NodeProps) => (
    <li
      style={{
        marginBottom: 4,
        lineHeight: 1.65,
        display: "list-item", // ← forcer le rendu de liste
      }}
    >
      {children}
    </li>
  ),
  strong: ({ children }: NodeProps) => (
    <strong style={{ fontWeight: 700, color: "#0a1d52" }}>{children}</strong>
  ),
  em: ({ children }: NodeProps) => (
    <em style={{ fontStyle: "italic" }}>{children}</em>
  ),
  a: ({ href, children }: AnchorProps) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#14539E", textDecoration: "underline" }}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }: NodeProps) => (
    <blockquote
      style={{
        borderLeft: "3px solid #14539E",
        paddingLeft: 14,
        margin: "12px 0",
        color: "#666",
        fontStyle: "italic",
      }}
    >
      {children}
    </blockquote>
  ),
  code: ({ children }: NodeProps) => (
    <code
      style={{
        background: "#F3F4F6",
        padding: "2px 6px",
        borderRadius: 4,
        fontSize: 13,
        fontFamily: "monospace",
      }}
    >
      {children}
    </code>
  ),
  hr: () => (
    <hr
      style={{
        border: "none",
        borderTop: "1px solid #e5e7eb",
        margin: "16px 0",
      }}
    />
  ),
  br: () => <br style={{ display: "block", marginBottom: 4 }} />,
};

export const MarkdownContent = ({
  content,
  className,
}: MarkdownContentProps) => {
  return (
    <div
      className={className}
      style={{
        lineHeight: 1.75,
        color: "#444",
        fontSize: 14,
        // S'assurer que les listes ne sont pas réinitialisées par un reset CSS global
        listStylePosition: "outside",
      }}
    >
      <ReactMarkdown components={components} remarkPlugins={[remarkBreaks]}>
        {content}
      </ReactMarkdown>
    </div>
  );
};
