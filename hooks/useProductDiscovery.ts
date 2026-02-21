import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firestore } from '../config/firebase';

export interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
    imageUrl?: string;
    productUrl: string;
    lastUpdated?: string;
}

export const useProductDiscovery = (userBudget: number, selectedCategory: string = 'All') => {
    const [affordablePhones, setAffordablePhones] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Basic validation
        if (userBudget < 0) {
            setAffordablePhones([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        try {
            const collectionRef = collection(firestore, 'market_products');

            // Build query based on budget and category
            let q;
            if (selectedCategory === 'All') {
                q = query(
                    collectionRef,
                    where('price', '<=', userBudget),
                    orderBy('price', 'desc')
                );
            } else {
                q = query(
                    collectionRef,
                    where('category', '==', selectedCategory),
                    where('price', '<=', userBudget),
                    orderBy('price', 'desc')
                );
            }

            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const products: Product[] = [];

                querySnapshot.forEach((doc) => {
                    products.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Product);
                });

                setAffordablePhones(products);
                setLoading(false);
                setError(null);
            }, (err) => {
                console.error("Firestore subscription error: ", err);
                setError(err instanceof Error ? err : new Error('Unknown Firestore error'));
                setLoading(false);
            });

            // Cleanup subscriber on unmount
            return () => unsubscribe();
        } catch (err) {
            console.error("Query building error: ", err);
            setError(err instanceof Error ? err : new Error('Failed to create query'));
            setLoading(false);
        }
    }, [userBudget, selectedCategory]);

    return { affordablePhones, loading, error };
};
