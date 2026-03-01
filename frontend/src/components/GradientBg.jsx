import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"

export default function GradientSection({ children, className = "" }) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(2,6,23)"
        gradientBackgroundEnd="rgb(15,23,42)"
        firstColor="6,182,212"
        secondColor="59,130,246"
        thirdColor="14,165,233"
        fourthColor="6,182,212"
        fifthColor="59,130,246"
        pointerColor="6,182,212"
        blendingValue="soft-light"
        interactive={false}
        containerClassName="!absolute !inset-0 !h-full !w-full pointer-events-none"
        className="pointer-events-none"
      />
      <div className="relative z-10">{children}</div>
    </section>
  )
}
