import { View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import BouncyPressable from '@/components/BouncyPressable';
import { logout } from '@/service/AuthService';

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <BouncyPressable style={{ backgroundColor: 'red', padding: 10, borderRadius: 10 }} onPress={() => logout()}>
        <ThemedText type="subtitle">Logout</ThemedText>
      </BouncyPressable>
    </View>
  );
}
