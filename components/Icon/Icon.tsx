"use client";

import React from "react";
import { ReactSVG } from "react-svg";

type IconProps = {
  icon: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
};

function Icon(props: IconProps) {
  return (
    <div
      className={props.className}
      style={{
        width: `${props.width}px`,
        height: `${props.height}px`,
        color: `${props.color}`,
        display: "inline-block",
      }}>
      <ReactSVG
        src={`/assets/icons/${props.icon}.svg`}
        beforeInjection={(svg) => {
          svg.setAttribute("width", `${props.width}`);
          svg.setAttribute("height", `${props.height}`);
        }}
        // loading={() => <span style={{ fontSize: props.width }}>⏳</span>}
        fallback={() => <span style={{ fontSize: props.width }}>⚠️</span>}
      />
    </div>
  );
}

export default Icon;
