import Image from "next/image";

export default function FlowerLogo() {
  return (
    <Image
      src="/ink_logo.png"
      alt="Ink logo"
      width={20}
      height={20}
      className="inline-block align-baseline ml-2"
    />
  );
}
