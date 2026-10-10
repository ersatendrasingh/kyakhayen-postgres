"use client";
import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
}

const AnimatedNumber = ({ value }: AnimatedNumberProps) => {
  const [displayedValue, setDisplayedValue] = useState(value);

  useEffect(() => {
    let start = 0;
    const end = Math.floor(value);
    const duration = 1000; // in milliseconds
    const increment = 50; // increase value every 50ms

    const totalIncrements = Math.ceil(duration / increment);
    const incrementValue = (end - start) / totalIncrements;

    const interval = setInterval(() => {
      start += incrementValue;
      setDisplayedValue(Math.floor(start));
      if (Math.floor(start) >= end) {
        clearInterval(interval);
      }
    }, increment);

    return () => clearInterval(interval);
  }, [value]);
  return (
    <h1 className="text-3xl font-bold text-white mb-4">{displayedValue}</h1>
  );
};

export default AnimatedNumber;
