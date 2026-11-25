type CsProseProps = {
  children: React.ReactNode;
};

/** Readable body copy for problem and role sections. */
export function CsProse({ children }: CsProseProps) {
  return (
    <p className="max-w-2xl text-base leading-8 text-muted sm:text-[1.0625rem]">
      {children}
    </p>
  );
}
