"use client";

import Container from "@/components/container";

const Copyrights = () => {
  return (
    <div className="mb-14 flex items-center justify-center border-t border-white/10 py-5 text-center text-sm text-white/48 md:mb-0">
      <Container>
        <p>
          &copy; {new Date().getFullYear()} Kya Khayen. All rights reserved.
        </p>
      </Container>
    </div>
  );
};

export default Copyrights;
