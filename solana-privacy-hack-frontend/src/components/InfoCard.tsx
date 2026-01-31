import type { FC } from "react";

type InfoCardProps = {
  title: string;
  desc: string;
};

const InfoCard: FC<InfoCardProps> = ({ title, desc }) => (
  <div className="bg-[#222] border border-[#333] rounded-lg p-4">
    <p className="font-semibold">{title}</p>
    <p className="text-xs text-gray-400">{desc}</p>
  </div>
);

export default InfoCard;
