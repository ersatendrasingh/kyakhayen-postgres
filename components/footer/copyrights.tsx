"use client";

import Container from "@/components/container";

const Copyrights = () => {
  return (
    <div className="mb-14 flex items-center justify-center border-t border-white/10 py-5 text-center text-sm text-white/48 md:mb-0">
      <Container>
        <p>
          &copy; {new Date().getFullYear()} Kya Khayen. All rights reserved.
          {" · "}
          <a
            href="https://getkasa.in"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-white focus:outline-none focus-visible:text-white"
          >
            A Kasa Product
          </a>
        </p>
      </Container>
    </div>
  );
};

export default Copyrights;
