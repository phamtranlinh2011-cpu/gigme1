import { app, db, auth } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export { firebaseConfig };
export const firebaseApp = app;
export { db, auth };
