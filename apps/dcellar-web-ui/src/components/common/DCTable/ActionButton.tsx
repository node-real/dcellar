import { CenterProps, Circle } from "@totejs/uikit";
import { GAClick } from "../GATracker";

interface ActionButtonProps extends CenterProps {
  gaClickName?: string;
}

export function ActionButton(props: ActionButtonProps) {
  const { children, onClick, gaClickName, ...restProps } = props;

  const onBeforeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <GAClick name={gaClickName}>
      <Circle
        className="btn-action"
        boxSize={24}
        // visibility={'hidden'}
        bg="rgba(0, 186, 52, 0.1)"
        flexShrink={0}
        cursor="pointer"
        borderRadius={18}
        transitionProperty="colors"
        transitionDuration="normal"
        _hover={{
          bgColor: 'rgba(0, 186, 52, 0.2)',
          color: 'readable.brand6',
        }}
        onClick={onBeforeClick}
        {...restProps}
      >
        {children}
      </Circle>
    </GAClick>
  );
}