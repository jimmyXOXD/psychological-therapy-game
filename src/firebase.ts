import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

export const logTelemetry = async (sessionId: string, action: string, details: Record<string, any>) => {
  try {
    await addDoc(collection(db, "telemetry"), {
      sessionId,
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging telemetry:", error);
  }
};

export const registerWin = async (sessionId: string, worldview: any, summary: string) => {
  try {
    await addDoc(collection(db, "victories"), {
      sessionId,
      worldview,
      summary,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging victory:", error);
  }
};
