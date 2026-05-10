import { useThemeColor } from '@/hooks/useThemeColor';
import {
    AntDesign,
    Entypo,
    EvilIcons,
    Feather,
    FontAwesome,
    FontAwesome5,
    FontAwesome6,
    Fontisto,
    Foundation,
    Ionicons,
    MaterialCommunityIcons,
    MaterialIcons,
    Octicons,
    SimpleLineIcons,
    Zocial,
} from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

const iconFamilies = {
    antdesign: AntDesign,
    entypo: Entypo,
    evilicons: EvilIcons,
    feather: Feather,
    fontawesome: FontAwesome,
    fontawesome5: FontAwesome5,
    fontawesome6: FontAwesome6,
    fontisto: Fontisto,
    foundation: Foundation,
    ionicons: Ionicons,
    material: MaterialIcons,
    'material-community': MaterialCommunityIcons,
    octicons: Octicons,
    'simple-line-icons': SimpleLineIcons,
    zocial: Zocial,
} as const;

export type IconFamily = keyof typeof iconFamilies;

export type ThemedIconProps = {
    lightColor?: string;
    darkColor?: string;
    family?: IconFamily;
    name: string;
    style?: StyleProp<TextStyle>;
    size?: number;
};

export function ThemedIcon({
    lightColor,
    darkColor,
    family = 'ionicons',
    name,
    size = 30,
    style,
    ...rest
}: ThemedIconProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
    const IconComponent = iconFamilies[family];

    return (
        <IconComponent
            size={size}
            name={name as never}
            style={[{ color }, style]}
            {...rest}
        />
    );
}
