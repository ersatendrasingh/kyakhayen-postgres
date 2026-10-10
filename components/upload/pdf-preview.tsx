import Image from "next/image";
import pdficon from "../../public/assets/images/pdf-icon.png";

const PDFViewer = () => {
  return (
    <Image
      alt="file uploader preview"
      src={pdficon}
      sizes="100%"
      fill
      priority
      className="object-cover rounded-md"
    />
  );
};

export default PDFViewer;
