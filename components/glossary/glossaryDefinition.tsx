export default function GlossaryDefinition({ text }: { text: string }) {
  const paragraphs = text.split(/\r?\n(?:[ \t]*\r?\n)+/)

  return (
    <div className="mt-4 space-y-5 text-base leading-8 text-[var(--muted)]">
      {paragraphs.map((paragraph, index) => (
        <p key={`${index}-${paragraph}`} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  )
}
