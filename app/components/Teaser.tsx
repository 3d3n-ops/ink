import QuoteRotator from './QuoteRotator';

export default function Teaser() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 sm:px-6 md:px-8">
      <div className="flex flex-col items-center gap-6 sm:gap-8 w-full max-w-4xl">
        {/* Main content container */}
        <div className="flex flex-col text-left space-y-1 sm:space-y-2 w-full" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-black">
            ink
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-black">
            2.2.26
          </p>
          <p className="text-lg sm:text-xl md:text-2xl text-black">
            coming soon
          </p>
        </div>

        {/* Quote section - separate container with matching width */}
        <div className="w-full px-2 sm:px-0" style={{ fontFamily: 'var(--font-eb-garamond), serif' }}>
          <QuoteRotator />
        </div>
      </div>
    </div>
  );
}
