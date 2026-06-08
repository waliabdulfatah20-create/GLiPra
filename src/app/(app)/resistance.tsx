// Resistance-training log route. Thin wrapper — logic + test live in the feature
// so the test never enters Expo Router's require.context over src/app.
export { ResistanceScreen as default } from '@/features/resistance/resistance-screen';
