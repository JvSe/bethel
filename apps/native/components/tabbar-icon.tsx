import type { ComponentType } from "react";
import type { ColorValue } from "react-native";
import type { IconProps } from "reicon-react-native/createIcon";

export const TabBarIcon = ({
  icon: Icon,
  color,
  focused = false,
}: {
  icon: ComponentType<IconProps>;
  color: ColorValue;
  focused?: boolean;
}) => {
  return (
    <Icon
      size={24}
      color={typeof color === "string" ? color : undefined}
      weight={focused ? "Filled" : "Outline"}
      style={{ marginBottom: -3 }}
    />
  );
};
