import React, { useState } from "react"
import cn from 'classnames';
import './index.module.scss';

export default function Iconfont ({
  className = '',
  iconName,
  fontSize,
  spanRef,
  ...restProps
}) {
  if (fontSize) {
    restProps = {
      ...restProps,
      style: {
        fontSize,
        ...restProps.style,
      },
    };
  }

  return (
    <svg
      className={cn('eus_icon', className)}
      aria-hidden="true"
      {...restProps}>
      <use ref={spanRef} xlinkHref={`#${iconName}`} />
    </svg>
  );
}
