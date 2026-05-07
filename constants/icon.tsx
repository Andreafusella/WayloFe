import { Feather } from "@expo/vector-icons";
import Ionicons from '@expo/vector-icons/Ionicons';

export const icon = {
    index: (props: any) => <Feather name="home" size={24} {...props} />,
    home: (props: any) => <Feather name="home" size={24} {...props} />,
    search: (props: any) => <Feather name="search" size={24} {...props} />,
    wallet: (props: any) => <Ionicons name="wallet" size={24} {...props} />,
    profile: (props: any) => <Feather name="user" size={24} {...props} />,
    events: (props: any) => <Feather name="star" size={24} {...props} />,
}