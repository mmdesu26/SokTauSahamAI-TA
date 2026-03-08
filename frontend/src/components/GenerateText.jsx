import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

export default function GenerateText({
  text,
  className = "",
}) {
  return (
    <TextGenerateEffect
      words={text}
      className={className}
      duration={3}
      filter={true}
    />
  );
}