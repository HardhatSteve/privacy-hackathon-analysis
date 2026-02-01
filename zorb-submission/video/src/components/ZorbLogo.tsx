import {Img, Node, NodeProps, Txt, Circle} from '@motion-canvas/2d';
import {createRef, Reference} from '@motion-canvas/core';

/**
 * ZORB Logo component for Motion Canvas
 *
 * Uses the SVG from public/zorb.svg
 * Can optionally show the "ZORB" text below
 */

export interface ZorbLogoProps extends NodeProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
}

export function ZorbLogo({
  size = 200,
  showText = false,
  textColor = '#00D1FF',
  ...props
}: ZorbLogoProps) {
  return (
    <Node {...props}>
      <Img
        src="/zorb.svg"
        width={size}
        height={size}
      />
      {showText && (
        <Txt
          text="ZORB"
          fontSize={size * 0.3}
          fontFamily="Inter, system-ui, sans-serif"
          fontWeight={700}
          fill={textColor}
          y={size * 0.7}
        />
      )}
    </Node>
  );
}
