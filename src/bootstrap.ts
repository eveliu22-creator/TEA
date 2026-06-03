import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { INITIAL_DRINKS } from './data';

export async function bootstrapDrinksDatabase() {
  try {
    const querySnapshot = await getDocs(collection(db, 'drinks'));
    
    // If the drinks database is empty, seed it with the handcrafted defaults from the user image menu
    if (querySnapshot.empty) {
      console.log('Drinks database is empty. Starting bootstrap seeding with INITIAL_DRINKS...');
      
      const seedPromises = INITIAL_DRINKS.map((drink) => {
        return setDoc(doc(db, 'drinks', drink.id), drink);
      });
      
      await Promise.all(seedPromises);
      console.log('Drinks database successfully seeded count:', INITIAL_DRINKS.length);
    } else {
      console.log('Drinks database already contains records. Skipping bootstrap seed.');
    }
  } catch (error) {
    console.warn('Bootstrap database warnings. This might be due to temporary connection or permissions:', error);
    // Silent catch so it doesn't crash the entire UI load
  }
}
