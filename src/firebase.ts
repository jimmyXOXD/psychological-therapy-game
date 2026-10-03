import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  writeBatch,
  getCountFromServer 
} from "firebase/firestore";
import aiStudioConfig from "../firebase-applet-config.json";

const app = initializeApp(aiStudioConfig);
export const db = getFirestore(app, (aiStudioConfig as any).firestoreDatabaseId);

let hasPrunedThisSession = false;

// Cleanup old telemetry entries to prevent unbounded document accumulation
export const pruneOldTelemetryIfNeeded = async (maxEntries = 500, pruneBatch = 100) => {
  if (hasPrunedThisSession) return;
  hasPrunedThisSession = true;

  try {
    const colRef = collection(db, "telemetry");
    const countSnapshot = await getCountFromServer(colRef);
    const totalDocs = countSnapshot.data().count;

    if (totalDocs > maxEntries) {
      // Query the oldest documents
      const q = query(colRef, orderBy("timestamp", "asc"), limit(pruneBatch));
      const oldDocs = await getDocs(q);
      
      const batch = writeBatch(db);
      oldDocs.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`Pruned ${oldDocs.size} old telemetry entries to prevent database overflow.`);
    }
  } catch (error) {
    // Non-blocking: cleanup failures will never interrupt game execution
    console.warn("Telemetry prune check skipped or failed:", error);
  }
};

export const logTelemetry = async (sessionId: string, action: string, details: Record<string, any>) => {
  try {
    await addDoc(collection(db, "telemetry"), {
      sessionId,
      action,
      details,
      timestamp: serverTimestamp()
    });

    // Run safe, one-time prune check in the background
    pruneOldTelemetryIfNeeded();
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

