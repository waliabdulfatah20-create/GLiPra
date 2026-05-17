import AsyncStorage from '@react-native-async-storage/async-storage';

export function getItem<T>(key: string): Promise<T | null> {
  return AsyncStorage.getItem(key).then((value) => {
    return value ? (JSON.parse(value) as T) : null;
  });
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function removeItem(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
