// Cardio log route. Thin wrapper — logic + test live in the feature so the test
// never enters Expo Router's require.context over src/app.
export { CardioScreen as default } from '@/features/cardio/cardio-screen';
