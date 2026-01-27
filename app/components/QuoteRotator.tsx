'use client';

import { useEffect, useState } from 'react';

const quotes = [
  { text: "The pen is the tongue of the mind.", author: "Miguel de Cervantes" },
  { text: "Either write something worth reading or do something worth writing.", author: "Benjamin Franklin" },
  { text: "You can make anything by writing.", author: "C. S. Lewis" },
  { text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Ernest Hemingway" },
  { text: "We write to taste life twice, in the moment and in retrospection.", author: "Anaïs Nin" },
  { text: "Fill your paper with the breathings of your heart.", author: "William Wordsworth" },
  { text: "Words are, in my not‑so‑humble opinion, our most inexhaustible source of magic.", author: "often attributed to J. K. Rowling" },
  { text: "Writing is thinking. To write well is to think clearly. That's why it's so hard.", author: "David McCullough" },
  { text: "If I don't write to empty my mind, I go mad.", author: "Lord Byron" },
  { text: "The purpose of writing is to make your words dance with clarity.", author: "anonymous" },
  { text: "A word after a word after a word is power.", author: "Margaret Atwood" },
  { text: "If you want to change the world, pick up your pen and write.", author: "Martin Luther" },
  { text: "Writing is the painting of the voice.", author: "Voltaire" },
  { text: "Writing isn't about making money, getting famous, getting dates, getting laid, or making friends. In the end, it's about enriching the lives of those who will read your work, and enriching your own life, as well.", author: "Stephen King" },
  { text: "Words can be like X‑rays if you use them properly—they'll go through anything. You read and you're pierced.", author: "Aldous Huxley" },
  { text: "There is no greater power on this earth than story.", author: "Libba Bray" },
  { text: "The purpose of a writer is to keep civilization from destroying itself.", author: "Albert Camus" },
  { text: "The art of writing is the art of discovering what you believe.", author: "Gustav Flaubert" },
  { text: "A good poem is a contribution to reality. The world is never the same once a good poem has been added to it.", author: "W. H. Auden (often quoted in similar form)" },
  { text: "Let me live, love, and say it well in good sentences.", author: "Sylvia Plath" },
];

export default function QuoteRotator() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setOpacity(0);
      
      // After fade out completes, change quote and fade in
      setTimeout(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
        setOpacity(1);
      }, 500); // Half of transition duration
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const currentQuote = quotes[currentQuoteIndex];

  return (
    <div 
      className="w-full h-[200px] sm:h-[250px] md:h-[300px] relative"
    >
      <div 
        className="absolute inset-0 flex flex-col justify-center text-center transition-opacity duration-500"
        style={{ opacity }}
      >
        <p 
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#161210] mb-4 sm:mb-6 leading-relaxed"
          style={{ fontFamily: "var(--font-eb-garamond), serif" }}
        >
          &ldquo;{currentQuote.text}&rdquo;
        </p>
        <p 
          className="text-base sm:text-lg md:text-xl text-[#161210]/70"
          style={{ fontFamily: "var(--font-figtree), sans-serif" }}
        >
          &mdash; {currentQuote.author}
        </p>
      </div>
    </div>
  );
}
