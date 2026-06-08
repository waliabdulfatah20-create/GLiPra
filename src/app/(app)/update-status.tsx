// GLP-1 Status update route. Thin wrapper — logic + test live in the feature so
// the test never enters Expo Router's require.context over src/app.
export { UpdateStatusScreen as default } from '@/features/medication-status/update-status-screen';
