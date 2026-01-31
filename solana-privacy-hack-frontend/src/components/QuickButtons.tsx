import type { FC } from "react";

type QuickButtonsProps = {
  setAmount: (val: string) => void;
};

const QuickButtons: FC<QuickButtonsProps> = ({ setAmount }) => (
  <div className="flex gap-2">
    {["0.2", "1", "5"].map((val) => (
      <button
        key={val}
        className="flex-1 bg-[#2A2A2A] text-gray-300 py-2 rounded-lg hover:bg-[#3A3A3A]"
        onClick={() => setAmount(val)}
      >
        {val}
      </button>
    ))}
  </div>
);

export default QuickButtons;
