import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firestore } from '../config/firebase';

export interface PricePoint {
    id: string;
    price: number;
    timestamp: any;
}

export const usePriceHistory = (productId: string | null) => {
    const [history, setHistory] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!productId) {
            setHistory([]);
            return;
        }

        setLoading(true);
        const historyRef = collection(firestore, 'market_products', productId, 'price_history');
        const q = query(historyRef, orderBy('timestamp', 'asc'), limit(50));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const points = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PricePoint));
            setHistory(points);
            setLoading(false);
        });

        return unsubscribe;
    }, [productId]);

    return { history, loading };
};
