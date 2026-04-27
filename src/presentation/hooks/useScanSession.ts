import { useState, useEffect, useRef } from "react";
import { startScanSession } from "../../application/usecases/StartScanSession";
import { endScanSession } from "../../application/usecases/EndScanSession";
import { platform } from "../../infrastructure/platform";

export function useScanSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cardsScanned, setCardsScanned] = useState(0);
  const cardsRef = useRef(cardsScanned);

  useEffect(() => {
    cardsRef.current = cardsScanned;
  }, [cardsScanned]);

  useEffect(() => {
    let id: string;
    startScanSession(platform.storage).then((out) => {
      id = out.sessionId;
      setSessionId(id);
    });
    return () => {
      if (id) {
        endScanSession(platform.storage, {
          sessionId: id,
          cardsScanned: cardsRef.current,
        });
      }
    };
  }, []);

  return { sessionId, cardsScanned, setCardsScanned };
}
