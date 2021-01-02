import { forwardRef, useLayoutEffect, useCallback } from "react";
import styled from "styled-components";

export const SCROLLBAR_SIZE = 13;
export const SCROLLBAR_THUMB_SIZE = SCROLLBAR_SIZE - 1;

const NativeScroll = styled.div`
  display: inline-block;
  vertical-align: top;

  // Firefox scrollbar style
  scrollbar-color: #dadce0 #fff;

  div {
    background: #eaeaea;
  }

  &::-webkit-scrollbar {
    width: ${SCROLLBAR_THUMB_SIZE}px;
    height: ${SCROLLBAR_THUMB_SIZE}px;
  }

  &::-webkit-scrollbar-track {
    background: #fff;
    border: 1px solid #fff;
  }

  &::-webkit-scrollbar-thumb {
    background: #dadce0;
    border-radius: ${SCROLLBAR_THUMB_SIZE / 2}px;
    border: 1px solid #fff;
    min-height: 58px;
  }

  &::-webkit-scrollbar-thumb:hover {
    border-width: 0;
    background-color: rgba(0, 0, 0, 0.4);
  }

  &::-webkit-scrollbar-thumb:active {
    border-width: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const HorizontalContainer = styled(NativeScroll)`
  overflow: scroll hidden;
`;

const VerticalContainer = styled(NativeScroll)`
  overflow: hidden scroll;
`;

export const ScrollCorner = styled.div`
  display: inline-block;
  box-sizing: border-box;
  border: 1px solid #eaeaea;
  background: #f8f8f8;
  vertical-align: top;
`;

type OnScrollHandler = (position: number) => void;

type GridScrollbarProps = {
  width: number;
  height: number;
  contentSize: number;
  orientation: "horizontal" | "vertical";
  onScroll: OnScrollHandler;
};

const GridScrollbar = forwardRef<HTMLDivElement, GridScrollbarProps>(
  ({ width, height, contentSize, orientation, onScroll }, forwardedRef) => {
    const onScrollPassthrough = useCallback(
      (e: Event) => {
        const target = e.target as HTMLDivElement;
        const position = orientation === "horizontal" ? target.scrollLeft : target.scrollTop;

        onScroll(position);
      },
      [orientation, onScroll]
    );

    // Manually managing the scroll event instead of onScroll helps reduce render frame execution time by 2ms-15ms
    useLayoutEffect(() => {
      const ref = forwardedRef as React.MutableRefObject<HTMLDivElement>;

      if (ref && ref.current) {
        ref.current.addEventListener("scroll", onScrollPassthrough);
      }

      return () => {
        const ref = forwardedRef as React.MutableRefObject<HTMLDivElement>;

        if (ref && ref.current) {
          ref.current.addEventListener("scroll", onScrollPassthrough);
        }
      };
    }, [forwardedRef, onScrollPassthrough]);

    return orientation === "horizontal" ? (
      <HorizontalContainer ref={forwardedRef} style={{ width: width, height: SCROLLBAR_SIZE }}>
        <div style={{ width: Math.max(contentSize, width), height: 1 }} />
      </HorizontalContainer>
    ) : (
      <VerticalContainer ref={forwardedRef} style={{ height: height, width: SCROLLBAR_SIZE }}>
        <div style={{ height: Math.max(contentSize, height), width: 1 }} />
      </VerticalContainer>
    );
  }
);

export default GridScrollbar;
